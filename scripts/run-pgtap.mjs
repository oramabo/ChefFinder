#!/usr/bin/env node
// Runs the SQL-level reservation test against a local Postgres.
//
// Resolution order for the connection string:
//   1. $DATABASE_URL
//   2. the Supabase local default (supabase start)
// Skips gracefully (exit 0) if psql isn't installed, so CI without a DB passes.

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlFile = join(__dirname, "..", "tests", "db", "reserve.test.sql");

const which = spawnSync("psql", ["--version"], { encoding: "utf8" });
if (which.status !== 0) {
  console.log("[test:db] psql not found — skipping SQL tests.");
  process.exit(0);
}

const dbUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

console.log(`[test:db] running ${sqlFile} against ${dbUrl}`);
const res = spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", sqlFile], {
  stdio: "inherit",
});

process.exit(res.status ?? 1);
