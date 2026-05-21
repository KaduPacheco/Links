import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const DATABASE_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "SUPABASE_DB_URL"
];

function resolveConnectionString() {
  for (const key of DATABASE_ENV_KEYS) {
    const value = process.env[key]?.trim();

    if (value) {
      return {
        connectionString: value,
        source: key
      };
    }
  }

  return null;
}

async function loadEnvFile(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}

async function ensureMigrationsTable(client) {
  await client.query(`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `);
}

async function readMigrationFiles(migrationsDir) {
  const entries = await readdir(migrationsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function main() {
  const currentFile = fileURLToPath(import.meta.url);
  const repoRoot = path.resolve(path.dirname(currentFile), "..");
  await loadEnvFile(path.join(repoRoot, ".env.local"));
  await loadEnvFile(path.join(repoRoot, ".env"));

  const database = resolveConnectionString();

  if (!database) {
    console.error(`No PostgreSQL connection string found. Set one of: ${DATABASE_ENV_KEYS.join(", ")}`);
    process.exit(1);
  }

  const migrationsDir = path.join(repoRoot, "database", "migrations");
  const migrationFiles = await readMigrationFiles(migrationsDir);

  if (migrationFiles.length === 0) {
    console.info("No migrations found.");
    return;
  }

  const client = new Client({ connectionString: database.connectionString });

  try {
    await client.connect();
    await ensureMigrationsTable(client);

    const appliedResult = await client.query("select name from schema_migrations");
    const applied = new Set(appliedResult.rows.map((row) => row.name));
    const pending = migrationFiles.filter((name) => !applied.has(name));

    console.info(`Connected using ${database.source}. Pending migrations: ${pending.length}.`);

    for (const migrationName of pending) {
      const migrationPath = path.join(migrationsDir, migrationName);
      const sql = await readFile(migrationPath, "utf8");

      console.info(`Applying ${migrationName}...`);
      await client.query("begin");

      try {
        await client.query(sql);
        await client.query("insert into schema_migrations (name) values ($1)", [migrationName]);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }

    if (pending.length === 0) {
      console.info("Database schema already up to date.");
      return;
    }

    console.info(`Applied ${pending.length} migration(s) successfully.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration failed.");
  console.error(error);
  process.exit(1);
});
