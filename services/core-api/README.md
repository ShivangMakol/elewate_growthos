# services/core-api

The modular monolith — Architecture Blueprint §5 / §2.2.

Hosts all 12 business modules (`src/modules/`) and the cross-cutting platform layer
(`src/platform/`) behind a single deployable API, following Clean Architecture layering
throughout: `domain/` (pure business logic, no I/O) → `application/` (use cases,
orchestration) → `infrastructure/` (persistence, external adapters) → `interface/`
(GraphQL resolvers, REST controllers).

**Design rule (Architecture §3):** No module directly queries another module's database
tables. All cross-module reads go through application service interfaces or the
read-optimized query/reporting layer.

**Extraction rule (Architecture §5):** a module folder should be deletable wholesale
without breaking the compile of unrelated modules (aside from `shared-kernel/` and
`platform/`). This is what keeps later extraction to a standalone service viable.

| Folder               | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `src/modules/`       | The 12 business bounded contexts                   |
| `src/platform/`      | Cross-cutting concerns shared by all modules       |
| `src/shared-kernel/` | Truly shared value objects (Money, Email, Address) |
| `src/bootstrap/`     | DI container, app wiring, config loading           |
| `test/e2e/`          | End-to-end tests spanning multiple modules         |

**Status:** Bootstrap-only. Fastify + Mercurius (GraphQL) + REST wired in
`src/bootstrap/`; entry point at `src/main.ts`. No authentication, no business modules
registered — `src/modules/*` remains exactly as scaffolded. `src/platform/*` also
remains untouched — the database work below is wired at the bootstrap layer, not as
platform-module logic, since there are no tables (business or platform) to give any
platform module real behavior yet.

**Framework note:** neither the Architecture Blueprint nor the TDD mandate a specific
HTTP framework or GraphQL server library (TDD §4.1 only pins "TypeScript (Node.js)").
Fastify + Mercurius were chosen for this milestone per explicit instruction — this
supersedes the NestJS + Apollo choice recorded in the Implementation Roadmap, which was
this project's own judgment call, not a source-doc requirement.

## Database (Prisma)

- **ORM:** Prisma 7. Config file: `prisma.config.ts` (co-located here, not in `db/`,
  since Prisma auto-discovers it relative to cwd and all `db:*` scripts below run with
  this package as cwd).
- **Schema + migrations:** live in `db/` at the repo root, not here — see that
  folder's README.
- **Connection:** `DATABASE_URL` (from `.env`, see root `.env.example`), via
  `@prisma/adapter-pg` (Prisma 7 requires an explicit driver adapter — bare
  `new PrismaClient()` is no longer valid).
- **No tables exist yet** — business or platform. `db/schema.prisma` has zero models,
  per explicit instruction for this milestone.

```bash
pnpm --filter @elewate/core-api run db:generate       # generate the Prisma Client
pnpm --filter @elewate/core-api run db:migrate:dev    # create + apply a migration
pnpm --filter @elewate/core-api run db:seed           # run db/seed/index.ts
pnpm --filter @elewate/core-api run db:studio         # Prisma Studio
```

**Verification boundary, flagged directly:** this was configured in a sandbox where
Prisma's CLI cannot actually run _at all_ — every subcommand (`init`, `generate`,
`migrate dev`, with or without `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1`) fails
identically, needing to download its schema-engine binary from
`binaries.prisma.sh`, which the sandbox's egress proxy blocks (`403 Forbidden`,
confirmed directly, not assumed). This is a harder blocker than the Docker Compose
milestone's — Prisma's CLI could not be exercised even partially, not even for pure
schema validation.

What _was_ verified for real there instead:

- `prisma.config.ts` loads correctly under Prisma's own CLI — the exact same command
  that then fails on the engine download first prints
  `Loaded Prisma config from prisma.config.ts.`, confirming the config file itself is
  valid and correctly discovered, before it fails on the unrelated network step.
- Real PostgreSQL connectivity, end-to-end: a local (non-Docker, apt-installed)
  PostgreSQL 16 instance was stood up, and `db/seed/index.ts` was actually run against
  it (via the raw `pg` driver, not the generated Prisma Client — see that file's
  comments for why), producing a real connection and a real query result.
- What could **not** be verified: the actual Prisma Client generation, and running a
  real migration through Prisma's own migrate engine. Run
  `pnpm --filter @elewate/core-api run db:generate` and
  `pnpm --filter @elewate/core-api run db:migrate:dev` on a machine with normal
  internet access to perform that real first run.
