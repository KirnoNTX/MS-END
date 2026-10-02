import "server-only";
import mysql from "mysql2/promise";
import type { ExecuteValues } from "mysql2";

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS working_days (
    work_date DATE NOT NULL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS app_settings (
    id TINYINT NOT NULL PRIMARY KEY,
    popup_enabled TINYINT(1) NOT NULL DEFAULT 0,
    popup_message VARCHAR(1000) NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS app_note (
    id TINYINT NOT NULL PRIMARY KEY,
    content TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

let schemaPromise: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const conn = await pool.getConnection();
      try {
        for (const stmt of SCHEMA) {
          await conn.query(stmt);
        }
        await conn.query(
          `INSERT INTO app_settings (id, popup_enabled, popup_message)
           VALUES (1, 0, '')
           ON DUPLICATE KEY UPDATE id = id`
        );
        await conn.query(
          `INSERT INTO app_note (id, content)
           VALUES (1, '')
           ON DUPLICATE KEY UPDATE id = id`
        );
      } finally {
        conn.release();
      }
    })();
  }
  return schemaPromise;
}

export async function query<T = mysql.RowDataPacket[]>(
  sql: string,
  params?: ExecuteValues[]
): Promise<T> {
  await ensureSchema();
  const [rows] = await pool.query(sql, params as ExecuteValues[]);
  return rows as T;
}

export async function execute(
  sql: string,
  params?: ExecuteValues[]
): Promise<mysql.ResultSetHeader> {
  await ensureSchema();
  const [result] = await pool.execute(sql, params as ExecuteValues[]);
  return result as mysql.ResultSetHeader;
}

