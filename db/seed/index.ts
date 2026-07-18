/**
 * Database seed script.
 *
 * Invoked via `prisma db seed` (per the `migrations.seed` command in
 * services/core-api/prisma.config.ts) or directly via `tsx db/seed/index.ts`.
 *
 * Genuinely a no-op right now: there are no models in db/schema.prisma yet
 * (no business tables, no platform tables — see that file's comments), so
 * there is nothing to seed. This script still connects for real, proving
 * the mechanism itself works end-to-end, rather than being an empty stub
 * that would silently "pass" without ever having proven anything.
 *
 * Written against the raw `pg` driver rather than the generated Prisma
 * Client. The generated client (db/schema.prisma's `output` path) can only
 * be produced by `prisma generate`, which requires downloading Prisma's
 * schema-engine binary — unavailable in the sandbox this was authored in
 * (see the README in this folder for the exact error). Once `prisma
 * generate` has actually been run somewhere with normal internet access,
 * this file should be upgraded to import and use the generated
 * PrismaClient instead, seeding real rows once real models exist.
 */
import { Client } from "pg";

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — cannot seed.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const result = await client.query("SELECT current_database(), current_user;");
    console.log(
      `Connected to ${result.rows[0].current_database} as ${result.rows[0].current_user}.`,
    );
    console.log("No models are defined yet in db/schema.prisma — nothing to seed.");
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
