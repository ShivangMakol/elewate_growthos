# db/

Database migrations and seed data for the PostgreSQL schema defined in
`Elewate-GrowthOS-Database-Schema.md`.

**Note on provenance:** this top-level `db/` folder is not part of the Architecture
Blueprint's or TDD's published folder-structure diagrams — those documents describe
the _logical_ schema domains (Database Schema doc) but don't specify where migration
tooling physically lives in the repo. `db/` was introduced in the Implementation
Roadmap (Section 3) as a necessary build-practical addition, and is created here at
your explicit request. Flagging this so the folder's origin is traceable.

| Folder        | Purpose                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `migrations/` | Ordered SQL (or ORM) migration files, one per schema change, following the naming convention established in M0 (`NNNN_description.sql`) |
| `seed/`       | Seed data — default roles, permission catalog, pipeline stage templates, and other fixture data needed for a freshly provisioned tenant |
