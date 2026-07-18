# migrations

Prisma-managed migrations for the schema defined in `../schema.prisma`, which will
eventually implement the logical schema domains described in
`Elewate-GrowthOS-Database-Schema.md` (~50 tables across 15 schemas).

**Correction from an earlier milestone:** this README previously described a
hand-rolled `NNNN_description.sql` naming convention with manual rollback files. That
predated the decision to use Prisma. Prisma manages its own migration folder naming
(`<timestamp>_<name>/migration.sql`) and its own `_prisma_migrations` tracking table —
don't hand-create migration folders here; always generate them via
`pnpm --filter @elewate/core-api run db:migrate:dev`.

**Status:** configured, not yet run. `db/schema.prisma` currently has zero models (no
business tables, no platform tables — see that file's comments), so there is nothing
to migrate yet. The first real migration will be created once IAM/tenancy/audit tables
land, starting at Milestone M0's remaining platform work.

See `services/core-api/prisma.config.ts` for how this path is wired in, and that
package's own notes for a verification caveat: Prisma's CLI could not actually run in
the sandbox this was configured in (engine binary download blocked), so this exact
mechanism is configured and schema-validated but not yet executed for real. Run
`pnpm --filter @elewate/core-api run db:migrate:dev` on a machine with normal internet
access to perform the real first migration.
