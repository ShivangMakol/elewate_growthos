# migrations

Ordered SQL migration files implementing the logical schema domains defined in
`Elewate-GrowthOS-Database-Schema.md` (~50 tables across 15 schemas).

Naming convention established in M0: `NNNN_description.sql`, sequential, with a
corresponding rollback for each. The first migration (`0001_platform_schema.sql`)
covers `platform.tenants`, `iam.*`, `audit.audit_events`, `files.file_metadata`, and
`notifications.*` — the platform layer that gates everything else.

No migrations exist yet.
