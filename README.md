# Elewate GrowthOS

A multi-tenant, white-labelable growth operating system unifying CRM, Leads, Pipeline,
Projects, Recruitment, Client Portal, Invoicing, Commissions, AI Assistant, Analytics,
Automation, and Team Management under one platform.

## Status

**Pre-implementation.** This repository currently contains only the planning
documents and the monorepo tooling scaffold (Milestone M0, tooling phase). No
application code, services, or packages exist yet.

## Planning Documents

The entire system is specified before any code is written. Read in this order:

1. [`Elewate-GrowthOS-Architecture.md`](./Elewate-GrowthOS-Architecture.md) — system architecture, module boundaries, tenancy model
2. [`Elewate-GrowthOS-Database-Schema.md`](./Elewate-GrowthOS-Database-Schema.md) — full PostgreSQL schema across all modules
3. [`Elewate-GrowthOS-Technical-Design-Document.md`](./Elewate-GrowthOS-Technical-Design-Document.md) — coding standards, API conventions, testing strategy, deployment
4. [`Elewate-GrowthOS-UX-Specification.md`](./Elewate-GrowthOS-UX-Specification.md) — design system, navigation, per-module screen specs
5. [`Elewate-GrowthOS-Implementation-Roadmap.md`](./Elewate-GrowthOS-Implementation-Roadmap.md) — technology stack, phases, dependency graph, build order
6. [`Elewate-GrowthOS-Task-List.md`](./Elewate-GrowthOS-Task-List.md) — milestone-by-milestone checklist (M0–M13)

## Monorepo Structure

Per the Architecture Blueprint (Section 5) and TDD (Section 5). Folders below marked
_(not yet created)_ will be added in the milestone that introduces them — see the Task
List for the exact schedule.

```
elewate-growthos/
├── apps/                    (not yet created — M1+)
│   ├── web/                 # Next.js tenant-facing app
│   ├── admin/               # Internal super-admin console
│   ├── mobile/               # React Native app
│   └── portal/               # Client Portal SPA
├── services/
│   └── core-api/            (not yet created — M1+)
├── packages/
│   ├── config/               # ✅ centralized ESLint/Prettier config (this milestone)
│   ├── ui-components/        (not yet created — M1+)
│   ├── api-client-sdk/       (not yet created)
│   ├── event-contracts/      (not yet created)
│   └── permissions-schema/   (not yet created)
├── infra/                    (not yet created — Terraform, ECS/K8s, CI/CD)
└── docs/
    └── architecture-decision-records/   (not yet created)
```

## Prerequisites

- Node.js `>=20.0.0 <21.0.0` (LTS)
- pnpm `9.15.0` (pinned via `packageManager` in `package.json`; use [Corepack](https://nodejs.org/api/corepack.html))

## Getting Started

```bash
corepack enable
pnpm install
```

There is nothing to build or run yet — no `apps/` or `services/` exist. This install
step validates that the workspace tooling itself (ESLint, Prettier, Husky, lint-staged,
commitlint, Turborepo) is wired correctly.

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
