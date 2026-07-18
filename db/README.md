# db/

Prisma schema, migrations, and seed data for the PostgreSQL database. ORM: Prisma 7
(chosen this milestone — the source docs left the "SQL (or ORM)" choice open).

**Note on provenance:** this top-level `db/` folder is not part of the Architecture
Blueprint's or TDD's published folder-structure diagrams — those documents describe
the _logical_ schema domains (Database Schema doc) but don't specify where migration
tooling physically lives in the repo. `db/` was introduced in the Implementation
Roadmap (Section 3) as a necessary build-practical addition, and is created here at
your explicit request. Flagging this so the folder's origin is traceable.

| File/Folder     | Purpose                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| `schema.prisma` | The Prisma schema itself — deliberately zero models right now, see that file's comments                   |
| `migrations/`   | Prisma-managed migration folders (`<timestamp>_<name>/migration.sql`), auto-generated — never hand-edited |
| `seed/`         | Seed script (`index.ts`), invoked via Prisma's configured seed command                                    |

Configuration lives in `services/core-api/prisma.config.ts` (Prisma 7 requires the
config file to be co-located with the package that runs its CLI commands), not here —
this folder holds only the schema, generated migrations, and seed script themselves.
