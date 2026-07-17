# apps/admin

Internal super-admin console (platform ops) — Architecture Blueprint §5.

Platform-team-only surface: tenant provisioning, tenancy-tier management, platform-wide
oversight. Not exposed to tenant users. Distinct from `apps/web`'s per-tenant Team
Management module, which manages users _within_ a single tenant.

**Status:** App shell built — same stack as `apps/web` (Next.js App Router, TypeScript,
Tailwind CSS v4, dark mode, shared `@elewate/ui-components` theme/primitives). Only page
is the placeholder dashboard — no business logic. Tenant provisioning UI (M0) and
tenancy-tier upgrades/white-label partner administration (M13) land later per the Task
List.
