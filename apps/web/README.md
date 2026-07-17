# apps/web

Next.js tenant-facing app (white-labelable) — Architecture Blueprint §5.

The primary product surface for internal team users across all 12 business modules
(CRM, Leads, Pipeline, Projects, Recruitment, Invoicing, Commissions, Automation,
Analytics, AI Assistant, Team Management). Client Portal is intentionally **not**
served from here — see `apps/portal`.

Stack (per Implementation Roadmap): Next.js (App Router) + React + TypeScript,
Apollo Client, Zustand, Tailwind + `packages/ui-components`.

**Status:** App shell built — Next.js App Router, TypeScript, Tailwind CSS v4, dark
mode (next-themes), and the shared theme/primitives from `@elewate/ui-components`. Only
page is the placeholder dashboard at `app/page.tsx` — no business logic. Real modules
are built out from M1 onward per the Task List.
