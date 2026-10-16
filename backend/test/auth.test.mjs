import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import Database from "better-sqlite3";

test("registration, sessions, duplicate submissions and account restrictions", { timeout: 45000 }, async (t) => {
  const checkout = fileURLToPath(new URL("../../", import.meta.url));
  const scratch = await mkdtemp(path.join(tmpdir(), "ieee-auth-"));
  const databaseFile = path.join(scratch, "test.sqlite");
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["backend/src/server.js"], {
    cwd: checkout,
    env: {
      ...process.env, NODE_ENV: "test", PORT: String(port), DATABASE_URL: "",
      SQLITE_PATH: databaseFile, AUTH_SECRET: randomBytes(32).toString("hex"),
      FRONTEND_URL: "http://localhost:3000", ADMIN_EMAILS: "",
      RESEND_API_KEY: "", SMTP_HOST: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let startupOutput = "";
  child.stdout.on("data", (chunk) => { startupOutput = (startupOutput + chunk).slice(-6000); });
  child.stderr.on("data", (chunk) => { startupOutput = (startupOutput + chunk).slice(-6000); });
  let db;
  async function request(route, { body, cookie } = {}) {
    const response = await fetch(`${origin}/api${route}`, {
      method: body ? "POST" : "GET",
      headers: {
        Origin: "http://localhost:3000",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    return { status: response.status, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
  }
  const account = (name) => ({ firstname: "Test", lastname: "Member", username: name, email: `${name}@example.test`, password: "SafePassword123!" });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 150; attempt += 1) {
      if (child.exitCode !== null) throw new Error(`API exited during startup: ${startupOutput}`);
      try {
        if ((await request("/health")).status === 200) { ready = true; break; }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, `API did not start: ${startupOutput}`);
    db = new Database(databaseFile);
    let member;
    await t.test("strong password rules remain enforced", async () => {
      const result = await request("/auth/register", { body: { ...account("weak"), password: "short" } });
      assert.equal(result.status, 400);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM users").get().count, 0);
    });
    await t.test("saved account returns its session immediately with both audit records", async () => {
      const started = performance.now();
      member = await request("/auth/register", { body: account("first") });
      t.diagnostic(`Local registration response: ${Math.round(performance.now() - started)} ms (SQLite, including bcrypt cost 12)`);
      assert.equal(member.status, 201);
      assert.ok(member.data.token);
      assert.ok(member.cookie);
      assert.equal(member.data.user.role, "admin");
      assert.ok(member.data.user.joinDate);
      assert.equal(member.data.user.password_hash, undefined);
      const stored = db.prepare("SELECT * FROM users WHERE id = ?").get(member.data.user.id);
      assert.match(stored.password_hash, /^\$2[aby]\$12\$/);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM login_events WHERE user_id = ?").get(stored.id).count, 1);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM admin_notifications WHERE target_id = ?").get(stored.id).count, 1);
      const session = await request("/auth/me", { cookie: member.cookie });
      assert.equal(session.status, 200);
      assert.equal(session.data.user.id, stored.id);
    });
    await t.test("duplicate and simultaneous submissions never create two accounts", async () => {
      assert.equal((await request("/auth/register", { body: account("first") })).status, 409);
      const simultaneous = await Promise.all([
        request("/auth/register", { body: account("second") }),
        request("/auth/register", { body: account("second") })
      ]);
      assert.deepEqual(simultaneous.map((item) => item.status).sort(), [201, 409]);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM users WHERE username = 'second'").get().count, 1);
      assert.equal(simultaneous.find((item) => item.status === 201).data.user.role, "member");
    });
    await t.test("existing credentials still log in", async () => {
      const login = await request("/auth/login", { body: { email: "first@example.test", password: "SafePassword123!" } });
      assert.equal(login.status, 201);
      assert.equal(login.data.user.id, member.data.user.id);
    });
    await t.test("restricted users receive their status but cannot use protected APIs", async () => {
      db.prepare("UPDATE users SET show_404 = 1 WHERE id = ?").run(member.data.user.id);
      const session = await request("/auth/me", { cookie: member.cookie });
      assert.equal(session.status, 200);
      assert.equal(session.data.user.show404, true);
      const applications = await request("/applications/me", { cookie: member.cookie });
      assert.equal(applications.status, 403);
      assert.equal(applications.data.code, "ACCOUNT_RESTRICTED");
      assert.equal((await request("/site")).status, 200);
    });
    await t.test("a notification failure does not report a saved account as failed", async () => {
      db.exec("DROP TABLE admin_notifications");
      const result = await request("/auth/register", { body: account("audit_failure") });
      assert.equal(result.status, 201);
      assert.equal((await request("/auth/me", { cookie: result.cookie })).status, 200);
    });
  } finally {
    db?.close();
    if (child.exitCode === null) {
      const exited = once(child, "exit");
      child.kill();
      await exited;
    }
    assert.equal(path.dirname(path.resolve(scratch)), path.resolve(tmpdir()));
    assert.ok(path.basename(scratch).startsWith("ieee-auth-"));
    await rm(scratch, { recursive: true, force: true });
  }
});
