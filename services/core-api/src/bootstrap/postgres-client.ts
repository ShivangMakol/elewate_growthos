import { Pool } from "pg";

/**
 * Bootstrap-only PostgreSQL connectivity check, used solely by the `/health`
 * REST endpoint to prove "Connect PostgreSQL" is real and observable at
 * runtime — not this service's actual data-access layer.
 *
 * Deliberately built on the raw `pg` driver rather than the generated Prisma
 * Client: the client can only be produced by `prisma generate`, which needs
 * a binary download unavailable in the sandbox this was authored in (see
 * this package's README). Once that's been run for real, each module's own
 * `infrastructure/repositories/` layer (TDD §5) will use the generated
 * PrismaClient directly — this file should NOT become the app's general
 * database access pattern; it exists only for this health check.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 2000,
});

export async function checkDatabaseConnection(): Promise<
  { connected: true } | { connected: false; error: string }
> {
  try {
    await pool.query("SELECT 1");
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function closeDatabasePool(): Promise<void> {
  await pool.end();
}
