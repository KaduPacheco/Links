import { Pool } from "pg";

type DatabaseConfig = {
  connectionString: string;
  source: string;
};

const DATABASE_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "SUPABASE_DB_URL"
] as const;

let pool: Pool | null = null;
let poolSource: string | null = null;

function resolveDatabaseConfig(): DatabaseConfig | null {
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

export function getDatabaseConfigMessage() {
  return `PostgreSQL não configurado. Defina uma destas variáveis: ${DATABASE_ENV_KEYS.join(", ")}.`;
}

export function hasDatabaseConfig() {
  return Boolean(resolveDatabaseConfig());
}

export function getPool() {
  const config = resolveDatabaseConfig();

  if (!config) {
    return null;
  }

  if (!pool || poolSource !== config.source) {
    pool = new Pool({
      connectionString: config.connectionString,
      max: 10,
      idleTimeoutMillis: 30_000
    });
    poolSource = config.source;
  }

  return pool;
}

export function getDatabaseSource() {
  return resolveDatabaseConfig()?.source ?? null;
}

export function requirePool() {
  const resolvedPool = getPool();

  if (!resolvedPool) {
    throw new Error(getDatabaseConfigMessage());
  }

  return resolvedPool;
}

export async function checkDatabaseHealth() {
  const resolvedPool = getPool();

  if (!resolvedPool) {
    return {
      configured: false,
      ok: true,
      latencyMs: null,
      source: null
    };
  }

  const startedAt = Date.now();

  try {
    await resolvedPool.query("select 1");

    return {
      configured: true,
      ok: true,
      latencyMs: Date.now() - startedAt,
      source: getDatabaseSource()
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      latencyMs: Date.now() - startedAt,
      source: getDatabaseSource(),
      error: error instanceof Error ? error.message : "Unknown database error"
    };
  }
}
