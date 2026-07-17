# apps/admin

Internal super-admin console (platform ops) — Architecture Blueprint §5.

Platform-team-only surface: tenant provisioning, tenancy-tier management, platform-wide
oversight. Not exposed to tenant users. Distinct from `apps/web`'s per-tenant Team
Management module, which manages users _within_ a single tenant.

No application code yet — introduced in M0 (tenant provisioning UI) and extended in
M13 (tenancy-tier upgrades, white-label partner administration).
