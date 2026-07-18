# Elewate GrowthOS

A multi-tenant, white-labelable growth operating system unifying CRM, Leads, Pipeline,
Projects, Recruitment, Client Portal, Invoicing, Commissions, AI Assistant, Analytics,
Automation, and Team Management under one platform.

## Status

**Bootstrap in progress (Milestone M0).** The monorepo tooling, full architecture
folder structure, shared packages, all three app shells (`apps/web`, `apps/admin`,
`apps/portal`), the `core-api` bootstrap server, and a local Docker Compose
development environment all exist. No business modules (CRM, Leads, Pipeline, etc.),
no authentication, and no database logic are wired in yet — see the Task List for
what's real vs. scaffolded.

## Planning Documents

The entire system is specified before any code is written. Read in this order:

1. [`Elewate-GrowthOS-Architecture.md`](./Elewate-GrowthOS-Architecture.md) — system architecture, module boundaries, tenancy model
2. [`Elewate-GrowthOS-Database-Schema.md`](./Elewate-GrowthOS-Database-Schema.md) — full PostgreSQL schema across all modules
3. [`Elewate-GrowthOS-Technical-Design-Document.md`](./Elewate-GrowthOS-Technical-Design-Document.md) — coding standards, API conventions, testing strategy, deployment
4. [`Elewate-GrowthOS-UX-Specification.md`](./Elewate-GrowthOS-UX-Specification.md) — design system, navigation, per-module screen specs
5. [`Elewate-GrowthOS-Implementation-Roadmap.md`](./Elewate-GrowthOS-Implementation-Roadmap.md) — technology stack, phases, dependency graph, build order
6. [`Elewate-GrowthOS-Task-List.md`](./Elewate-GrowthOS-Task-List.md) — milestone-by-milestone checklist (M0–M13)

## Monorepo Structure

Per the Architecture Blueprint (Section 5) and TDD (Section 5).

```
elewate-growthos/
├── apps/
│   ├── web/                  # ✅ Next.js shell — placeholder dashboard only
│   ├── admin/                 # ✅ Next.js shell — placeholder dashboard only
│   ├── mobile/                (not yet created)
│   └── portal/                 # ✅ Next.js shell — placeholder dashboard only
├── services/
│   └── core-api/               # ✅ Fastify + Mercurius bootstrap only —
│                                #    no auth, no DB logic, no business modules
├── packages/
│   ├── config/                 # ✅ centralized ESLint/Prettier config
│   ├── ui-components/           # ✅ shared theme + Button/Card/ThemeToggle
│   ├── api-client-sdk/           # ✅ configured, placeholder entry point
│   ├── event-contracts/          # ✅ configured, placeholder entry point
│   └── permissions-schema/       # ✅ configured, placeholder entry point
├── infra/                      (not yet created — Terraform, ECS/K8s, CI/CD)
├── db/                          (not yet created — migrations, seed data)
├── docker-compose.yml           # ✅ local dev: Postgres, Redis, MinIO, Mailpit, core-api
├── scripts/                     # ✅ dev environment scripts — see scripts/README.md
└── docs/
    └── architecture-decision-records/   (not yet created)
```

## Prerequisites

- Node.js `>=22.0.0 <23.0.0` (current Active LTS)
- pnpm `9.15.0` (pinned via `packageManager` in `package.json`; use [Corepack](https://nodejs.org/api/corepack.html))
- Docker + Docker Compose (for the local development environment — see below)

## Getting Started

```bash
corepack enable
pnpm install
```

This installs and links all workspace packages, apps, and `core-api`. To run
individual pieces directly on the host (without Docker):

```bash
pnpm --filter @elewate/web dev       # http://localhost:3000
pnpm --filter @elewate/admin dev     # (pick a different port if running alongside web)
pnpm --filter @elewate/portal dev
pnpm --filter @elewate/core-api dev  # http://localhost:4000/health, /graphiql
```

`core-api` run this way has nothing to actually connect to — see the next section for
that.

## Local Development Environment

`docker-compose.yml` at the repo root provisions everything `core-api` will eventually
need: PostgreSQL, Redis, MinIO (S3-compatible storage), Mailpit (SMTP capture), and
`core-api` itself, built from `services/core-api/Dockerfile`.

```bash
pnpm run dev:setup
```

This creates `.env` from `.env.example` if you don't have one yet, builds and starts
the full stack, waits for every service to report healthy, and prints where each one
is reachable (`core-api` REST/GraphQL, Postgres, Redis, MinIO API + console, Mailpit
UI). See [`scripts/README.md`](./scripts/README.md) for what each script does and
what's actually been verified about this setup versus what still needs a first real
boot on a machine with normal internet access.

Other useful commands:

```bash
pnpm run docker:logs   # follow logs from every service
pnpm run docker:ps     # see current status
pnpm run docker:down   # stop everything (keeps data volumes)
pnpm run dev:reset     # stop everything AND delete data volumes (destructive, confirms first)
```

## Tooling

| Concern                         | Tool                 | Config location                                           |
| ------------------------------- | -------------------- | --------------------------------------------------------- |
| Package management / workspaces | pnpm workspaces      | `pnpm-workspace.yaml`                                     |
| Task orchestration / caching    | Turborepo            | `turbo.json`                                              |
| Type checking                   | TypeScript (strict)  | `tsconfig.base.json`                                      |
| Linting                         | ESLint (flat config) | `eslint.config.mjs` → `packages/config/eslint.base.mjs`   |
| Formatting                      | Prettier             | `prettier.config.js` → `packages/config/prettier.base.js` |
| Pre-commit hooks                | Husky + lint-staged  | `.husky/`, `lint-staged` field in `package.json`          |
| Commit message linting          | commitlint           | `commitlint.config.js`                                    |

## Contributing

- Conventional Commits required (`feat:`, `fix:`, `refactor:`, `chore:`, `test:`, ...) — enforced by commitlint on every commit.
- No direct commits to `main`; all changes via PR with at least one required review and passing CI (TDD 4.4).
- Trunk-based development: short-lived feature branches, squash-merged.

## License

Proprietary. All Rights Reserved. See [`LICENSE`](./LICENSE).
