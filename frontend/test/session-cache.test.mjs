import assert from "node:assert/strict";
import test from "node:test";
import { createSessionCache } from "../lib/session-cache.mjs";

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test("concurrent account consumers share one request and refresh after expiry", async () => {
  let clock = 0;
  let calls = 0;
  const cache = createSessionCache({ maxAge: 15, now: () => clock });
  const load = async () => ({ user: { id: ++calls } });
  const first = cache.read(load);
  const second = cache.read(load);
  assert.equal(first, second);
  assert.deepEqual(await first, { user: { id: 1 } });
  assert.deepEqual(await cache.read(load), { user: { id: 1 } });
  clock = 16;
  assert.deepEqual(await cache.read(load), { user: { id: 2 } });
  assert.equal(calls, 2);
});

test("login response supplies the profile without another request", async () => {
  const cache = createSessionCache();
  const session = { user: { id: "new-account" } };
  cache.write(session);
  assert.equal(await cache.read(() => assert.fail("unnecessary auth request")), session);
});

test("a guest response arriving after login cannot overwrite the new session", async () => {
  const cache = createSessionCache();
  const guest = deferred();
  const pending = cache.read(() => guest.promise);
  await Promise.resolve();
  cache.write({ user: { id: "signed-in" } });
  guest.reject(new Error("401"));
  assert.equal((await pending).user.id, "signed-in");
});

test("logout prevents an earlier account response from restoring the session", async () => {
  const cache = createSessionCache();
  const oldSession = deferred();
  const pending = cache.read(() => oldSession.promise);
  await Promise.resolve();
  cache.write({ user: null });
  oldSession.resolve({ user: { id: "signed-out" } });
  assert.deepEqual(await pending, { user: null });
  assert.deepEqual(await cache.read(() => assert.fail("logout must stay signed out")), { user: null });
});

test("cleared sessions ignore in-flight responses and can load a different user", async () => {
  const cache = createSessionCache();
  const stale = deferred();
  const pending = cache.read(() => stale.promise);
  await Promise.resolve();
  cache.clear();
  stale.resolve({ user: { id: "old" } });
  assert.deepEqual(await pending, { user: null });
  assert.equal((await cache.read(async () => ({ user: { id: "new" } }))).user.id, "new");
});

test("a failed account request can be retried and does not cache the error", async () => {
  const cache = createSessionCache();
  await assert.rejects(cache.read(async () => { throw new Error("offline"); }), /offline/);
  assert.equal((await cache.read(async () => ({ user: { id: "recovered" } }))).user.id, "recovered");
});
