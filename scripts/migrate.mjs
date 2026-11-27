import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import nextEnv from "@next/env";
import mysql from "mysql2/promise";

nextEnv.loadEnvConfig(process.cwd());

const databaseUrl = new URL(process.env.DATABASE_URL ?? "mysql://app:app@localhost:3306/exam_bank");
if (!["mysql:", "mysql2:"].includes(databaseUrl.protocol)) {
  throw new Error("DATABASE_URL must use the mysql:// scheme.");
}

const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\/+/, ""));
if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
  throw new Error("DATABASE_URL database name may contain only letters, numbers, and underscores.");
}

const connectionOptions = {
  host: databaseUrl.hostname || "localhost",
  port: databaseUrl.port ? Number(databaseUrl.port) : 3306,
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  charset: "utf8mb4",
  multipleStatements: false,
};

const connection = await mysql.createConnection({ ...connectionOptions, database: databaseName });
try {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration VARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  const migrationDirectory = fileURLToPath(new URL("../../../db/migrations/", import.meta.url));
  const files = (await readdir(migrationDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  const [appliedRows] = await connection.query("SELECT migration FROM schema_migrations");
  const applied = new Set(appliedRows.map((row) => row.migration));

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Already applied: ${file}`);
      continue;
    }

    const sql = await readFile(path.join(migrationDirectory, file), "utf8");
    const statements = sql.split(";").map((statement) => statement.trim()).filter(Boolean);
    for (const statement of statements) {
      await connection.query(statement);
    }
    await connection.execute("INSERT INTO schema_migrations (migration) VALUES (?)", [file]);
    console.log(`Applied: ${file}`);
  }
} finally {
  await connection.end();
}
