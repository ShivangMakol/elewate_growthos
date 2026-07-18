/**
 * Prisma 7 configuration — required for migrate/introspection since Prisma 7
 * moved project configuration (connection URL, migrations path, seed
 * command) out of schema.prisma and into this file.
 *
 * Co-located with package.json (not at repo root) since Prisma's CLI
 * auto-discovers this file relative to the current working directory, and
 * all db:* scripts below are run via `pnpm --filter @elewate/core-api ...`,
 * whose cwd is this package.
 *
 * The actual schema.prisma and migrations/ live in db/ at the repo root
 * (not nested inside this service), matching that folder's existing purpose
 * (Task List: "db/ — migrations and seed data").
 */
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "../../db/schema.prisma",
  migrations: {
    path: "../../db/migrations",
    seed: "tsx ../../db/seed/index.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
