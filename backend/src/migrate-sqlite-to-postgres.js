import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { db, initDb } from "./db.js";

const sqlitePath = process.env.SQLITE_PATH || path.resolve("backend/data/ieee-anu.sqlite");

if (!fs.existsSync(sqlitePath)) {
  console.error(`SQLite file not found: ${sqlitePath}`);
  process.exit(1);
}

await initDb();

const sqlite = new Database(sqlitePath);
const tables = ["users", "stats", "creators", "videos", "products", "applications", "admin_messages"];

for (const table of tables) {
  const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
  if (!rows.length) {
    console.log(`${table}: no rows`);
    continue;
  }

  const columns = Object.keys(rows[0]);
  const quotedColumns = columns.map((column) => `"${column}"`).join(", ");
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
  const updateColumns = columns
    .filter((column) => column !== "id")
    .map((column) => `"${column}" = EXCLUDED."${column}"`)
    .join(", ");

  const sql = `
    INSERT INTO ${table} (${quotedColumns})
    VALUES (${placeholders})
    ON CONFLICT (id) DO UPDATE SET ${updateColumns}
  `;

  for (const row of rows) {
    await db.query(sql, columns.map((column) => row[column]));
  }

  console.log(`${table}: migrated ${rows.length} rows`);
}

sqlite.close();
await db.end();
console.log("SQLite data migrated to PostgreSQL successfully.");
