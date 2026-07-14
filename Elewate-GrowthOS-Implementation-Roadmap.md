# Elewate GrowthOS — Implementation Roadmap

**Prepared as: Lead Software Engineer / CTO planning brief**
**Status:** Pre-code — sequencing, structure, and stack decisions only. No implementation until this is approved.
**Reads alongside:** Architecture Blueprint, Database Schema Design, Technical Design Document, UX Specification.

---

## 1. Guiding Principle for Sequencing

This is a 12-module modular monolith with hard cross-cutting dependencies (tenancy, IAM, audit, events) underneath everything. The single biggest risk to a project like this isn't any one module being hard — it's building modules in the wrong order and having to retrofit tenant isolation, auth, or event contracts into code that already assumed they didn't exist.

So the sequencing logic is:

1. **Nothing tenant-scoped gets built before tenancy + RLS + IAM are real and tested.** Every table, every query, every test depends on this.
2. **Build the shortest possible "revenue spine" end-to-end before going wide.** One thin vertical slice (Lead → Contact → Deal → Won → Invoice) proven all the way through the stack is worth more than five modules built to 80% in parallel.
3. **Modules with the fewest inbound dependencies go first**; modules that *consume* other modules' data (Analytics, AI Assistant, Automation) go last, because they need something real to read from.
4. **Recruitment is architecturally almost standalone** — it can run on a parallel track without blocking the core spine.

---

## 2. Technology Stack (Final Decisions)

The TDD left several choices open ("e.g., X or Y"). Locking them in now so the team isn't relitigating stack choices mid-build.

| Layer | Choice | Why |
|---|---|---|
| **Monorepo tooling** | Turborepo | Native Next.js ecosystem fit, simpler learning curve than Nx for a team this size, matches `apps/` + `packages/` structure already specified |
| **Backend language/runtime** | TypeScript, Node.js (LTS) | Per TDD 4.1 |
| **Backend framework** | NestJS | Its module system maps almost 1:1 onto the Architecture Blueprint's domain/application/infrastructure/interface layering, has first-class DI (needed for the in-process module interfaces), and native GraphQL + REST support in one framework |
| **Web app** | Next.js (App Router) + React + TypeScript | Per TDD 4.1 |
| **Mobile** | React Native (Expo) | Faster iteration pre-Series-A; can eject if native modules are needed later |
| **API layer** | GraphQL (Apollo Server) primary, REST (versioned) for webhooks/partner API | Per Architecture Blueprint 6.1 |
| **Database** | PostgreSQL (managed — RDS or Cloud SQL) | Per Database Schema doc |
| **Cache / session store** | Redis (managed — ElastiCache or equivalent) | Per Architecture 7.2 |
| **Queue / background jobs** | BullMQ on Redis (MVP) → migrate to SQS at Growth stage | Keeps infra surface area minimal pre-Series-A (one Redis, not Redis + SQS); BullMQ's job model maps cleanly to the durable/resumable workflow requirement (FR-AUT2) |
| **Event bus** | In-process event emitter (MVP, single deployable) → Redis Streams or SQS/SNS at Series A when modules start splitting | Matches Architecture 11.4 growth path — don't pay distributed-bus complexity before there's more than one deployable |
| **Object storage** | S3-compatible (AWS S3) | Per Architecture 15 |
| **Client-side server-state** | Apollo Client (matches GraphQL-primary choice) | Per TDD 7.1 |
| **Client-side UI/ephemeral state** | Zustand | Per TDD 7.1 |
| **Validation** | Zod, shared via `packages/event-contracts` | Per TDD 9.2 |
| **Design system** | Tailwind CSS + custom `ui-components` package (shadcn/ui as a base where useful) | Matches white-label theming requirement (CSS var-driven tokens) |
| **Deployment (API/workers)** | AWS ECS Fargate (MVP) → EKS/Kubernetes at Growth stage | Per Architecture 11.4 — "ECS as lighter-weight equivalent pre-Series-A" |
| **Deployment (web/portal)** | Vercel | Per TDD 11.2 |
| **IaC** | Terraform | Per Architecture folder structure |
| **CI/CD** | GitHub Actions, Turborepo-aware pipeline | Matches monorepo choice |
| **Observability** | OpenTelemetry (traces) + Datadog (logs/metrics/APM) | Per TDD 13 |
| **Testing** | Jest (unit/integration), Playwright (E2E), axe-core (a11y) | Per TDD 10 |
| **Analytics read store** | Postgres materialized views + read replica (MVP) → ClickHouse (Growth stage, if analytical query volume demands it) | Per Database Schema Part R note — don't pre-pay for ClickHouse operational overhead before it's needed |

---

## 3. Folder Structure (Finalized for Build)

This is the Architecture Blueprint's structure with the TDD's implementation-level additions merged, plus the concrete additions needed to actually start (env config, seed scripts, ADR template).

```
elewate-growthos/
├── apps/
│   ├── web/                        # Next.js tenant-facing app
│   ├── admin/                      # Internal super-admin console
│   ├── mobile/                     # React Native (Expo)
│   └── portal/                     # Client Portal SPA
│
├── services/
│   └── core-api/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── iam/                    # Built in Phase 0 (platform-tier, but lives here since it's also a business-facing module later — Team Mgmt UI sits on top of it)
│       │   │   ├── team-management/
│       │   │   ├── crm/
│       │   │   ├── leads/
│       │   │   ├── pipeline/
│       │   │   ├── projects/
│       │   │   ├── client-portal/
│       │   │   ├── invoicing/
│       │   │   ├── commissions/
│       │   │   ├── recruitment/
│       │   │   ├── automation/
│       │   │   ├── analytics/
│       │   │   └── ai-assistant/
│       │   │       └── <each module>/
│       │   │           ├── domain/
│       │   │           ├── application/
│       │   │           ├── infrastructure/
│       │   │           ├── interface/
│       │   │           └── __tests__/
│       │   ├── platform/                   # Cross-cutting, Phase 0
│       │   │   ├── tenancy/
│       │   │   ├── iam-core/                # token issuance, RLS session binding (distinct from the iam *module* above, which is the tenant-facing role/permission mgmt UI layer)
│       │   │   ├── audit/
│       │   │   ├── notifications/
│       │   │   ├── file-storage/
│       │   │   ├── event-bus/
│       │   │   └── ai-orchestration/
│       │   ├── shared-kernel/
│       │   └── bootstrap/
│       └── test/e2e/
│
├── packages/
│   ├── ui-components/
│   ├── api-client-sdk/
│   ├── event-contracts/
│   ├── permissions-schema/
│   └── config/
│
├── infra/
│   ├── terraform/
│   ├── ecs/                        # (k8s/ added at Growth stage per stack decision above)
│   └── ci-cd/
│
├── db/
│   ├── migrations/                 # ordered per Section 5 below
│   └── seed/                       # default roles, permission catalog, pipeline stage templates
│
└── docs/
    ├── architecture-decision-records/
    └── runbooks/
```

**Note:** The Architecture Blueprint listed `iam` only as a cross-cutting platform module. Splitting it into `platform/iam-core` (token/session/RLS plumbing — Phase 0, invisible to users) and `modules/team-management` + `modules/iam` (the tenant-facing role/permission management UI — Phase 1/2) resolves an ambiguity the source docs left implicit: authentication infrastructure and the "Team Management" product surface are built at different times by different urgency, even though they share the same database schema.

---

## 4. Module Dependency Graph

```
                         ┌─────────────────────────────┐
                         │   PLATFORM LAYER (Phase 0)    │
                         │  tenancy · iam-core · audit ·  │
                         │  event-bus · file-storage ·    │
                         │  notification-bus (skeleton)   │
                         └───────────────┬─────────────┘
                                         │  (everything below depends on this)
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
        ┌────────────────┐     ┌────────────────┐      ┌────────────────┐
        │ Team Management │     │      CRM        │      │  Recruitment    │
        │  (Phase 1)      │     │   (Phase 1)      │      │  (Phase 3,      │
        │                 │     │                  │      │  parallel track)│
        └────────┬────────┘     └────────┬─────────┘      └────────┬────────┘
                 │                       │                          │
                 │              ┌────────┴────────┐                 │ (depends on
                 │              ▼                 │                 │  Team Mgmt for
                 │       ┌──────────────┐          │                 │  interviewer
                 │       │    Leads      │          │                 │  scheduling)
                 │       │  (Phase 1)    │          │                 │
                 │       └──────┬───────┘          │                 │
                 │              │ (convert)         │                 │
                 │              ▼                 ▼                 │
                 │       ┌──────────────────────────────┐            │
                 │       │          Pipeline              │            │
                 │       │         (Phase 1)              │◄───────────┘ (no hard dep,
                 │       └──────┬─────────────────┬───────┘              just shares
                 │              │ (Won)            │ (source_deal_id)     Kanban component)
                 │              ▼                 ▼
                 │       ┌──────────────┐  ┌──────────────┐
                 │       │  Invoicing    │  │   Projects    │
                 │       │  (Phase 2)    │  │  (Phase 2)    │
                 │       └──────┬───────┘  └──────┬───────┘
                 │              │ (payment)         │ (client_visible)
                 │              ▼                 ▼
                 │       ┌──────────────┐  ┌──────────────────┐
                 │       │ Commissions   │  │  Client Portal    │
                 │       │  (Phase 2)    │  │   (Phase 2)       │
                 │       └──────────────┘  └──────────────────┘
                 │
                 └──────────────────────┐
                                        ▼
                         ┌──────────────────────────────┐
                         │   Automation (Phase 3)         │◄── needs domain events from
                         │  (subscribes to events from     │    every module above to be
                         │   every module above)           │    meaningful, so it trails
                         └──────────────────────────────┘    them by design
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                              ▼
              ┌──────────────────┐          ┌──────────────────────┐
              │  Analytics         │          │   AI Assistant         │
              │  (Phase 3)         │          │   (Phase 4)            │
              │  reads denormalized│          │  calls into every       │
              │  data from all      │          │  module's application  │
              │  modules            │          │  layer as tools —      │
              └──────────────────┘          │  needs those use-cases │
                                              │  to exist and be stable│
                                              └──────────────────────┘
```

**Key dependency facts driving the order:**
- **Pipeline is the highest-fan-in module** in the whole system (Leads convert into it, Invoicing/Commissions/Projects/Client Portal all key off `deal_id`). It cannot be deferred — it's the pivot the "revenue spine" turns on.
- **CRM has zero upstream dependencies** (only Platform), which is exactly why it's the first business module built — it de-risks nothing but itself, so it's the cheapest place to validate the domain/application/infra layering pattern before repeating it 11 more times.
- **Client Portal depends on both Projects and Invoicing being real** (it surfaces client-visible milestones and payable invoices) — building it earlier would mean building against stubs.
- **Recruitment's only real dependency is Team Management** (interviewer = a user). It shares the Kanban UI component but has no data dependency on CRM/Pipeline — this is why it's the one module that can run on a parallel engineering track without blocking anything.
- **Automation, Analytics, and AI Assistant are structurally "last"** — not because they're less important, but because their entire value proposition is *acting on or reading from* other modules' events/data. Building them first means building them against nothing.

---

## 5. Development Phases

### Phase 0 — Foundations (no user-facing features ship)
**Goal:** Prove the hard architectural bets before any product code depends on them.

- Monorepo scaffold (Turborepo, `packages/config` lint/tsconfig baseline)
- Terraform: VPC, RDS Postgres, Redis, S3 buckets, ECS cluster skeleton
- `platform.tenants` + tenant provisioning pipeline (FR-P1) — automated, API-driven, <60s
- `iam.users`, `tenant_memberships`, `roles`, `permissions`, `role_permissions`, `user_roles`, `sessions`, `api_keys` — full schema + RLS policies, forced
- OAuth2.1/OIDC auth flow, JWT issuance, refresh rotation, Argon2id hashing
- RLS enforcement middleware (`app.current_tenant_id` via `SET LOCAL`, transaction-scoped — Database Schema doc's explicit PgBouncer-safety note)
- **Tenant-isolation adversarial CI test suite** (TDD 9.3) — built now, not bolted on later, because every subsequent module's CI gate depends on this existing
- `audit.audit_events` with hash-chaining, append-only, `REVOKE UPDATE/DELETE` at role level
- Event bus skeleton (in-process emitter + typed contracts in `packages/event-contracts`)
- File storage service (`files.file_metadata`, S3 pointer pattern, virus-scan hook)
- Notification bus skeleton (templates + delivery log tables; channel fan-out logic stubbed, not fully wired — real usage starts in Phase 1)
- CI/CD pipeline stages 1–6 (lint → unit → build → integration → security scan → a11y scan) operational
- `ui-components` package: design tokens, white-label theming CSS variables, base primitives (button, input, drawer, table shell)
- Global app shell (top bar, sidebar, Cmd+K skeleton — no module content yet)

**Exit criteria:** A tenant can be provisioned via API, a user can sign up/log in/get a JWT with correct tenant claims, and the adversarial RLS test suite passes on an empty schema. Nothing else is buildable safely until this is true.

---

### Phase 1 — The Revenue Spine (first real product surface)
**Goal:** One coherent, demoable loop: invite a team, add a contact, capture a lead, convert it, move a deal through the pipeline.

- **Team Management** (Members List, invite flow, Roles & Permissions editor, My Profile) — built first in this phase because every other module's RBAC checks need real roles to test against, not fixtures
- **CRM** (Contacts, Companies, Activity Timeline) — first module built end-to-end through all four architectural layers; used as the reference implementation other module teams copy
- **Leads** (capture, scoring engine, Kanban board, conversion flow FR-L2)
- **Pipeline** (Deals, Kanban, Pipeline Stages config, Quotes, Forecast view) — the shared `KanbanBoard` component (UX spec Part C.1) gets built here and is reused, not rebuilt, in Leads and later Recruitment
- Shared Kanban interaction pattern (drag-drop + keyboard equivalent + mobile swipe fallback) — built once as the reference for Cross-Module Consistency Rule #1

**Exit criteria:** E2E test passes for the full journey: invite teammate → create contact → capture lead → score it → convert to Contact+Deal → move deal through stages to Won. This is the single most important milestone in the whole project — it's the first proof the modular monolith's boundaries actually work under a real cross-module flow.

---

### Phase 2 — Delivery & Money
**Goal:** Everything that happens *after* a deal is won.

- **Projects** (standalone + Won-deal-originated, Kanban/List/Gantt views, milestones, client-visibility flag)
- **Invoicing** (manual + auto-from-deal, tax rules, partial payments, status state machine, aging view)
- **Commissions** (plans, tiered rules, immutable ledger with reversal-only corrections, `needs_review` queue)
- **Client Portal** (magic-link/SSO auth, approvals, invoice payment flow) — built last in this phase specifically because it's a *consumer* of Projects and Invoicing data; building it earlier would mean mocking both

**Exit criteria:** E2E test passes for Deal Won → Invoice generated → Client Portal payment → Commission accrual, including the `needs_review` flag path for a deliberately ambiguous commission scenario.

---

### Phase 3 — Vertical Expansion & System Intelligence
**Goal:** Fill out the remaining surface area and start making the platform *smart* about the data it now has.

- **Recruitment** (can start in parallel with Phase 1/2 on a second engineering track once Team Management ships — flagged explicitly in Section 4 as low-coupling)
- **Automation** (visual builder + list-based accessible equivalent, trigger→condition→action engine, durable/resumable execution) — now meaningful because Leads/Pipeline/Invoicing/Projects are emitting real domain events to subscribe to
- **Analytics** (per-module dashboards + custom builder, CQRS read models fed by the event bus) — now meaningful because there's real data across 8+ modules to aggregate

**Exit criteria:** A tenant admin can build a real automation ("notify rep when lead goes cold") end-to-end and see it fire; each module's pre-built dashboard renders real aggregated data with working data-table fallback views.

---

### Phase 4 — AI, Hardening, and Scale Readiness
**Goal:** The differentiating layer, plus everything that makes this survive contact with paying enterprise customers.

- **AI Assistant** (non-modal panel, confirm-before-execute, tool-calling into modules' application-layer use cases, distinct audit actor type) — deliberately last, because it needs a stable, complete command/query surface across all 11 business modules to have anything meaningful to call
- Dedicated-schema and dedicated-instance tenancy tiers (currently only shared/RLS tier is load-bearing through Phases 1–3)
- SSO/SAML for enterprise tenants, MFA enforcement by tenant policy
- White-label partner tier (Partner → Partner's Clients multi-level tenancy)
- Load testing under simulated multi-tenant "noisy neighbor" conditions
- Pre-launch penetration test
- DR drill (tenant-level restore capability, per Architecture 14.3)
- SOC 2 Type II readiness pass

**Exit criteria:** AI Assistant can execute a real cross-module action (e.g., "create a deal for Acme Corp and schedule a follow-up task") with full audit trail and permission-scoped tool access; a full DR drill restores a single tenant without affecting others.

---

## 6. Milestones Summary

| Milestone | Phase | Definition of Done |
|---|---|---|
| **M0 — Platform Bedrock** | 0 | Tenant provisioning, auth, RLS, audit trail, adversarial isolation tests all green in CI |
| **M1 — First Vertical Slice** | 1 | Team Mgmt + CRM live; RBAC enforced end-to-end on a real module |
| **M2 — Revenue Spine Complete** | 1 | Lead → Contact + Deal → Pipeline → Won, full E2E test suite green |
| **M3 — Money Loop Complete** | 2 | Won Deal → Invoice → Payment → Commission, including Client Portal payment flow |
| **M4 — Full Surface Area** | 3 | All 12 business modules live; Recruitment merged from parallel track |
| **M5 — Platform Is Smart** | 3 | Automation + Analytics operational against real cross-module event data |
| **M6 — AI-Native & Enterprise-Ready** | 4 | AI Assistant live with confirm-before-execute; SSO, dedicated tenancy tiers, DR drills passed |

---

## 7. Recommended Build Order (Condensed)

1. Platform layer (tenancy, IAM, audit, events, files) — **blocking, no exceptions**
2. Team Management
3. CRM
4. Leads
5. Pipeline
6. Projects
7. Invoicing
8. Commissions
9. Client Portal
10. *(parallel track, starting after step 2)* Recruitment
11. Automation
12. Analytics
13. AI Assistant
14. Enterprise/scale hardening (SSO, dedicated tenancy, white-label partner tier, DR, pen test)

---

## 8. Open Questions Before I'd Start Coding

A CTO doesn't hand this to engineers without resolving these — flagging rather than assuming:

1. **Team size/parallelization** — the "Recruitment on a parallel track" plan assumes a second engineering pod exists by Phase 1. If this is a single-developer or small-team build, Recruitment should just move to sequential position after Client Portal instead.
2. **BullMQ vs. SQS from day one** — I defaulted to BullMQ for lower infra overhead, but if multi-region or extreme durability is a near-term requirement, starting on SQS avoids a migration later.
3. **ClickHouse timing** — deferred to Growth stage per the schema doc's own guidance, but if Analytics/AI usage-cost dashboards are a launch-blocking sales requirement, this should move earlier.
4. **First paying design partner / target tenant profile** — knowing whether the first real tenant is internal (Elewate itself) or an external pilot customer would sharpen which Phase 1 edge cases (custom fields, import flows) get built now vs. deferred.

---

*Awaiting approval before any code is written.*
