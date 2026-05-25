import "dotenv/config";
import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

const { Pool, types } = pg;

types.setTypeParser(20, (value) => Number(value));

const databaseUrl = process.env.DATABASE_URL;
const usePostgres = Boolean(databaseUrl);

let pgPool = null;
let sqliteDb = null;

if (usePostgres) {
  pgPool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false
  });
} else {
  const dataDir = path.resolve("backend/data");
  const dbPath = process.env.SQLITE_PATH || path.join(dataDir, "ieee-anu.sqlite");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec("PRAGMA foreign_keys = ON");
  sqliteDb.exec("PRAGMA journal_mode = WAL");
}

export const db = pgPool || sqliteDb;
export const databaseProvider = usePostgres ? "postgresql" : "sqlite";

function toPostgresQuery(sql, params = {}) {
  const values = [];
  const indexes = new Map();
  const text = sql.replace(/\$[a-zA-Z_][a-zA-Z0-9_]*/g, (name) => {
    if (!indexes.has(name)) {
      indexes.set(name, values.length + 1);
      values.push(params[name]);
    }
    return `$${indexes.get(name)}`;
  });

  return { text, values };
}

export async function initDb() {
  if (usePostgres) {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        firstname TEXT NOT NULL,
        lastname TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        discord TEXT,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        full_name TEXT NOT NULL,
        university_email TEXT NOT NULL,
        age INTEGER NOT NULL,
        country TEXT NOT NULL,
        hours TEXT,
        experience TEXT NOT NULL,
        why_join TEXT NOT NULL,
        skills TEXT NOT NULL DEFAULT '[]',
        referral TEXT,
        admin_note TEXT,
        status TEXT NOT NULL DEFAULT 'قيد المراجعة',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS stats (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL UNIQUE,
        value INTEGER NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS creators (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        platform TEXT NOT NULL,
        followers TEXT NOT NULL,
        url TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        speaker TEXT NOT NULL,
        youtube_id TEXT NOT NULL UNIQUE,
        views TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price TEXT NOT NULL,
        status TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS admin_messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        note TEXT,
        priority TEXT NOT NULL DEFAULT 'normal',
        audience TEXT NOT NULL,
        recipients_count INTEGER NOT NULL DEFAULT 0,
        sent_count INTEGER NOT NULL DEFAULT 0,
        failed_count INTEGER NOT NULL DEFAULT 0,
        support_email TEXT,
        support_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admin_activity (
        id TEXT PRIMARY KEY,
        admin_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT,
        description TEXT NOT NULL,
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admin_notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS login_events (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        event_type TEXT NOT NULL DEFAULT 'login',
        ip_address TEXT,
        forwarded_for TEXT,
        user_agent TEXT,
        device_type TEXT,
        browser TEXT,
        operating_system TEXT,
        platform TEXT,
        language TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS live_workshop (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        meet_url TEXT NOT NULL,
        speaker TEXT,
        starts_at TEXT,
        is_live INTEGER NOT NULL DEFAULT 0,
        is_visible INTEGER NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const { rows } = await pgPool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'applications'`
    );
    const columns = new Set(rows.map((row) => row.column_name));

    if (!columns.has("user_id")) {
      await pgPool.query("ALTER TABLE applications ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL");
    }

    if (!columns.has("admin_note")) {
      await pgPool.query("ALTER TABLE applications ADD COLUMN admin_note TEXT");
    }

    return;
  }

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      firstname TEXT NOT NULL,
      lastname TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      discord TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      full_name TEXT NOT NULL,
      university_email TEXT NOT NULL,
      age INTEGER NOT NULL,
      country TEXT NOT NULL,
      hours TEXT,
      experience TEXT NOT NULL,
      why_join TEXT NOT NULL,
      skills TEXT NOT NULL DEFAULT '[]',
      referral TEXT,
      admin_note TEXT,
      status TEXT NOT NULL DEFAULT 'قيد المراجعة',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS stats (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL UNIQUE,
      value INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS creators (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      platform TEXT NOT NULL,
      followers TEXT NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      speaker TEXT NOT NULL,
      youtube_id TEXT NOT NULL UNIQUE,
      views TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price TEXT NOT NULL,
      status TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS admin_messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      note TEXT,
      priority TEXT NOT NULL DEFAULT 'normal',
      audience TEXT NOT NULL,
      recipients_count INTEGER NOT NULL DEFAULT 0,
      sent_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      support_email TEXT,
      support_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS admin_activity (
      id TEXT PRIMARY KEY,
      admin_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      description TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS admin_notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS login_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      event_type TEXT NOT NULL DEFAULT 'login',
      ip_address TEXT,
      forwarded_for TEXT,
      user_agent TEXT,
      device_type TEXT,
      browser TEXT,
      operating_system TEXT,
      platform TEXT,
      language TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS live_workshop (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      meet_url TEXT NOT NULL,
      speaker TEXT,
      starts_at TEXT,
      is_live INTEGER NOT NULL DEFAULT 0,
      is_visible INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applicationColumns = sqliteDb.prepare("PRAGMA table_info(applications)").all();
  const hasUserId = applicationColumns.some((column) => column.name === "user_id");
  const hasAdminNote = applicationColumns.some((column) => column.name === "admin_note");

  if (!hasUserId) {
    sqliteDb.exec("ALTER TABLE applications ADD COLUMN user_id TEXT");
  }

  if (!hasAdminNote) {
    sqliteDb.exec("ALTER TABLE applications ADD COLUMN admin_note TEXT");
  }
}

export async function getOne(sql, params = {}) {
  if (usePostgres) {
    const query = toPostgresQuery(sql, params);
    const result = await pgPool.query(query.text, query.values);
    return result.rows[0] || null;
  }

  return sqliteDb.prepare(sql).get(params) || null;
}

export async function getAll(sql, params = {}) {
  if (usePostgres) {
    const query = toPostgresQuery(sql, params);
    const result = await pgPool.query(query.text, query.values);
    return result.rows;
  }

  return sqliteDb.prepare(sql).all(params);
}

export async function run(sql, params = {}) {
  if (usePostgres) {
    const query = toPostgresQuery(sql, params);
    return pgPool.query(query.text, query.values);
  }

  return sqliteDb.prepare(sql).run(params);
}
