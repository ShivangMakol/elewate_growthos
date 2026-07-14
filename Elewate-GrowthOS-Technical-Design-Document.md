# Elewate GrowthOS — Technical Design Document (TDD)

**Document type:** Engineering blueprint — synthesizes the Architecture Blueprint, UX Specification, and Database Schema Design into actionable build standards
**Audience:** Engineering team, technical leads, QA, DevOps, and future contributors
**Status:** Foundational — governs all implementation decisions from this point forward

---

## 1. Functional Requirements

Functional requirements are organized by module, reflecting the 12 business modules plus platform-level capabilities already established. Each is stated as a testable capability, not an implementation detail.

### 1.1 Platform-Level
- FR-P1: The system must support tenant provisioning via an automated pipeline (tenant record → RLS policies → default roles → subscription link) completing in under 60 seconds.
- FR-P2: The system must support three tenancy isolation tiers (shared/dedicated-schema/dedicated-instance) selectable per tenant without requiring a different codebase.
- FR-P3: White-label tenants must be able to configure custom domain, logo, color palette, and terminology overrides without engineering involvement.
- FR-P4: The system must support a Partner → Partner's Clients hierarchy (multi-level tenancy) for resellers.

### 1.2 CRM
- FR-CRM1: Users can create, view, edit, soft-delete, merge, and import Contacts and Companies.
- FR-CRM2: The system must maintain a unified activity timeline per Contact/Company/Deal.
- FR-CRM3: Contacts must support tenant-defined custom fields without schema migration.

### 1.3 Lead Management
- FR-L1: Leads can be captured via form, import, or manual entry, and automatically scored against tenant-configured rules.
- FR-L2: Leads can be qualified/disqualified and converted into a Contact + Deal in a single action.
- FR-L3: Lead status changes must be achievable via both drag-drop and a keyboard/menu-driven equivalent.

### 1.4 Sales Pipeline
- FR-PL1: Deals move through tenant-configurable stages with per-stage default probability and optional required fields (e.g., close date).
- FR-PL2: Deals marked Won must trigger downstream Invoicing and Commission accrual events automatically.
- FR-PL3: The system must provide a weighted forecast view aggregating open deal value by stage/probability/period.

### 1.5 Projects
- FR-PR1: Projects can be created standalone or generated from a Won deal, inheriting relevant Contact/Company context.
- FR-PR2: Tasks support board (Kanban), list, and timeline (Gantt) views with fractional ordering to avoid reorder cascades.
- FR-PR3: Project milestones can be flagged client-visible, syncing to the Client Portal automatically.

### 1.6 Recruitment
- FR-REC1: Job requisitions maintain an independent candidate pipeline per role; a candidate may exist in multiple requisition pipelines simultaneously.
- FR-REC2: Interview scheduling must detect calendar conflicts before confirmation, not after.

### 1.7 Client Portal
- FR-CP1: External users authenticate via magic link or SSO and see only their own tenant-scoped, permission-filtered data.
- FR-CP2: Clients can approve/reject deliverables and quotes, with decisions logged to the audit trail.
- FR-CP3: Clients can view and pay outstanding invoices through an embedded payment flow.

### 1.8 Invoicing
- FR-INV1: Invoices can be generated manually or automatically from a Won deal/quote, with tenant-configured tax rules applied.
- FR-INV2: Partial payments are supported; invoice status must transition automatically (draft → sent → partially_paid → paid/overdue).
- FR-INV3: Overdue invoices must be surfaced in a dedicated aging view (0-30/31-60/60+ buckets).

### 1.9 Commission Tracking
- FR-COM1: Commission plans support tenant-defined tiered/threshold calculation rules.
- FR-COM2: Commission ledger entries are immutable and append-only; corrections occur via reversal entries, never edits.
- FR-COM3: Calculation conflicts must be flagged `needs_review` and routed to an admin queue rather than silently resolved.

### 1.10 AI Assistant
- FR-AI1: The assistant must be accessible from any screen via a non-modal panel and answer/act using natural language.
- FR-AI2: Every AI-proposed action requires explicit user confirmation before execution; the AI never has elevated privileges beyond the requesting user's own permissions.
- FR-AI3: All AI tool calls are logged to the audit trail with a distinct actor type.

### 1.11 Analytics
- FR-AN1: Pre-built dashboards exist per module (Sales, Projects, Recruitment, Finance) in addition to custom user-built dashboards.
- FR-AN2: Every chart widget must have a data-table alternate view and fail independently of other widgets on the same dashboard.

### 1.12 Workflow Automation
- FR-AUT1: Workflows are defined as trigger → condition → action chains, editable via a visual builder with a list-based accessible equivalent.
- FR-AUT2: Workflow executions are durable, resumable from the failed step, and versioned so in-flight runs are unaffected by concurrent edits to the live definition.

### 1.13 Team Management
- FR-TM1: Admins can invite, assign roles to, and deactivate team members; every user can independently manage their own profile.
- FR-TM2: Roles and permissions are tenant-customizable (RBAC + ABAC), with a permission matrix editor and read-only list equivalent.

---

## 2. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | p95 API latency < 300ms for CRUD; < 150ms for cached reads; dashboard load < 2s; background job lag < 60s at p95 (as established in the Architecture Blueprint, Section 11.5). |
| **Scalability** | Support horizontal scaling of the stateless application layer; database must scale from single-primary to tenant-sharded without application-layer rewrite. |
| **Availability** | 99.9% uptime target for shared-tier tenants; 99.95%+ contractually available for dedicated-instance/enterprise tenants. |
| **Security** | Defense-in-depth per the Architecture Blueprint Section 12; RLS enforced and forced on every tenant-scoped table; encryption at rest and in transit. |
| **Data Isolation** | Zero cross-tenant data leakage, verified continuously via automated adversarial tests in CI (Section 9 below). |
| **Accessibility** | WCAG 2.1 AA baseline across all first-party surfaces, per the UX Specification's global accessibility section. |
| **Auditability** | Every sensitive action recorded immutably with before/after state and tamper-evident hash chaining. |
| **Maintainability** | Modular monolith with clean-architecture layering; any module must be deletable/extractable without breaking unrelated modules. |
| **Localization readiness** | All user-facing strings externalized from day one, even if only English ships initially; currency/date formatting locale-aware. |
| **Cost efficiency** | Compute and storage costs scale roughly linearly with active tenant count, not fixed per-tenant overhead, at the shared tier. |

---

## 3. API Conventions

These conventions operationalize the API Strategy defined in the Architecture Blueprint (Section 6).

### 3.1 Protocol Choice
- **GraphQL**: primary contract for web/mobile clients. Single endpoint (`/graphql`), schema organized by module namespace (e.g., `pipeline { deals }`, `crm { contacts }`) mirroring the database schema boundaries for cognitive consistency between DB, domain, and API layers.
- **REST**: `/v1/...` for webhooks, the public partner API, and any integration surface consumed by external developers.

### 3.2 REST Conventions
- Resource-oriented nouns, plural (`/v1/deals`, `/v1/contacts/{id}`), never verbs in the path.
- Tenant is **never** part of the URL — derived from the authenticated token/subdomain exclusively, preventing tenant-ID enumeration.
- Standard HTTP verbs map to CRUD; partial updates use `PATCH` with JSON Merge Patch semantics, never `PUT` for partial data.
- **Idempotency-Key header required** on all `POST`/`PATCH` mutations; server persists a short-lived idempotency record keyed by `(tenant_id, idempotency_key)` to safely handle client retries.
- **Cursor-based pagination only** — response shape: `{ data: [...], page_info: { next_cursor, has_more } }`. Offset pagination is explicitly banned per the architecture doc.
- Standard error envelope (Section 7 below) for all non-2xx responses.
- Versioning: breaking changes require a new `/v2/` prefix with a minimum 12-month deprecation overlap; additive changes (new optional fields) ship without a version bump.

### 3.3 GraphQL Conventions
- Schema evolves additively; deprecated fields carry `@deprecated(reason: "...")` for at least 2 release cycles before removal.
- Mutations follow `moduleVerbNoun` naming (`pipelineCreateDeal`, `crmMergeContacts`), returning a consistent payload shape: `{ success, data, errors }`.
- DataLoader-style batching mandatory for all list-to-detail resolution paths (N+1 prevention is a merge-blocking lint/review rule, not a suggestion).
- Field-level authorization: resolvers check permissions per field, not just per query root — a field a role can't see is omitted from the response, not returned null with a client-side hide.
- Query complexity limits enforced server-side (cost-based analysis) to prevent a single malformed query from degrading shared-tier performance for other tenants.

### 3.4 Webhooks (Outbound)
- HMAC-SHA256 signed payloads (`X-GrowthOS-Signature` header); tenant-configurable per event type.
- Delivery retried with exponential backoff (5 attempts over ~24h), then dead-lettered with a visible "failed webhook" indicator in tenant settings.
- Payload versioned independently of the API version, since webhook consumers upgrade on their own schedule.

### 3.5 Rate Limiting
- Token-bucket per tenant + per API key, tiered by subscription plan; `429` responses include `Retry-After` header.

---

## 4. Coding Standards

### 4.1 Language & Framework Baseline
- **Backend:** TypeScript (Node.js), strict mode enabled project-wide (`strict: true`, no implicit `any`, no unchecked index access).
- **Frontend (web):** TypeScript + React (Next.js), matching the Architecture Blueprint's `apps/web` designation.
- **Mobile:** TypeScript + React Native.
- Shared TypeScript types for domain DTOs and event contracts live in `packages/event-contracts`, imported by both backend and frontend — no duplicated type definitions across the boundary.

### 4.2 Style & Linting
- ESLint + Prettier, config centralized in `packages/config`, enforced via pre-commit hook and CI gate (no merge on lint failure).
- No default exports for modules with more than one export; named exports only, to keep refactors and auto-imports predictable.
- Max function length guideline: 40 lines before extraction is expected; max file length guideline: 300 lines before a module split is expected — guidelines, not hard blocks, but flagged in review.

### 4.3 Clean Architecture Enforcement
- Dependency direction is enforced via lint rules (e.g., `eslint-plugin-boundaries` or equivalent): `domain/` may not import from `infrastructure/` or `interface/`; `application/` may not import framework-specific code (no Express/Next imports inside use-case handlers).
- Domain entities are framework-agnostic plain TypeScript classes/functions — no ORM decorators inside `domain/`, ORM mapping lives entirely in `infrastructure/`.

### 4.4 Commit & Branching Standards
- Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `test:`) — enables automated changelog generation and semantic-release tooling.
- Trunk-based development: short-lived feature branches (target < 2 days old), merged via squash-merge to `main` behind feature flags for anything not ready for full release.
- No direct commits to `main`; all changes via PR with at least one required review and passing CI.

### 4.5 Documentation-in-Code
- Every application-layer use case (command/query handler) carries a docblock stating: purpose, required permissions, emitted domain events — since this is the layer most relevant to future contributors tracing "what happens when X occurs."
- Architecture Decision Records (ADRs) stored in `docs/architecture-decision-records/`, one file per significant decision, using a lightweight standard template (Context / Decision / Consequences).

---

## 5. Folder Structure

Reuses and extends the structure already established in the Architecture Blueprint (Section 5), with implementation-level additions:

```
elewate-growthos/
├── apps/
│   ├── web/                       # Next.js tenant app
│   ├── admin/                     # Platform super-admin console
│   ├── mobile/                    # React Native
│   └── portal/                    # Client Portal SPA
│
├── services/
│   └── core-api/
│       ├── src/
│       │   ├── modules/
│       │   │   └── <module>/
│       │   │       ├── domain/
│       │   │       │   ├── entities/
│       │   │       │   ├── value-objects/
│       │   │       │   └── events/
│       │   │       ├── application/
│       │   │       │   ├── commands/
│       │   │       │   ├── queries/
│       │   │       │   └── dto/
│       │   │       ├── infrastructure/
│       │   │       │   ├── repositories/
│       │   │       │   ├── mappers/
│       │   │       │   └── adapters/
│       │   │       ├── interface/
│       │   │       │   ├── graphql/          # resolvers, schema fragments
│       │   │       │   └── rest/             # controllers (webhooks, partner API)
│       │   │       └── __tests__/
│       │   │           ├── unit/
│       │   │           ├── integration/
│       │   │           └── fixtures/
│       │   ├── platform/          # tenancy, iam, audit, notifications, etc.
│       │   ├── shared-kernel/
│       │   └── bootstrap/
│       └── test/
│           └── e2e/
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
│   ├── k8s/
│   └── ci-cd/
│
└── docs/
    ├── architecture-decision-records/
    └── runbooks/                   # operational runbooks (Section 14)
```

**Rule:** a module's `__tests__/` directory structure mirrors its source structure 1:1 — a reviewer should be able to predict a test file's location from its source file's path without searching.

---

## 6. Naming Conventions

Extends the database naming conventions (already defined in the Database Schema doc) up through the application and API layers, ensuring the same concept is named consistently at every layer.

| Layer | Convention | Example |
|---|---|---|
| Database table | `snake_case`, plural, schema-qualified | `pipeline.deals` |
| Domain entity (TS class) | `PascalCase`, singular | `Deal` |
| Domain event | `PascalCase` + past tense | `DealStageChanged`, `InvoicePaid` |
| Application command | `VerbNoun` (imperative) | `CreateDealCommand`, `MergeContactsCommand` |
| Application query | `GetNoun` / `ListNoun` | `GetDealByIdQuery`, `ListOverdueInvoicesQuery` |
| REST endpoint | plural noun path | `/v1/deals`, `/v1/deals/{id}` |
| GraphQL mutation | `moduleVerbNoun` (camelCase) | `pipelineCreateDeal` |
| GraphQL type | `PascalCase`, singular | `Deal`, `Invoice` |
| React component | `PascalCase` | `DealDetailPage`, `PipelineBoard` |
| React hook | `useCamelCase` | `useDealDetail`, `usePermission` |
| File name (component) | matches component name | `DealDetailPage.tsx` |
| Environment variable | `SCREAMING_SNAKE_CASE`, module-prefixed | `BILLING_STRIPE_SECRET_KEY` |
| Feature flag key | `dot.case`, module-scoped | `ai.assistant.voice_input` |
| Event bus topic | `module.entity.event` | `pipeline.deal.won`, `invoicing.invoice.paid` |

**Rule:** whenever a domain event fires in code, its name must match the event's representation in `event_contracts` exactly (enforced by shared type imports, not just convention discipline) — this is what keeps the Automation Engine's trigger catalog, the Audit log's `action` field, and the codebase's actual event names from drifting apart over time.

---

## 7. Component Architecture

### 7.1 Backend Component Layering (per module, recap + implementation detail)
```
Interface (GraphQL resolver / REST controller)
   → validates request shape, resolves auth context
   → invokes Application Layer
Application (Command/Query handler)
   → orchestrates domain logic + infrastructure calls
   → emits domain events post-commit
Domain (Entity/Value Object/Domain Service)
   → pure business logic, no I/O
Infrastructure (Repository/Adapter)
   → persistence, external API calls, cache
```
Each command handler follows a consistent internal shape: **authorize → validate → load aggregate → execute domain logic → persist → emit events → return DTO** — this exact sequence is the template every new use case is built from, making cross-module code review faster since reviewers know what to expect regardless of which module they're reading.

### 7.2 Frontend Component Architecture
- **Atomic-ish, pragmatic layering** (not strict atomic design dogma): `packages/ui-components` holds primitive, purely-presentational components (Button, Input, Table, Drawer) shared across all apps and used to implement the white-label theming from the UX spec (all components consume CSS variables/theme tokens, never hardcoded colors).
- Module-specific composite components (e.g., `PipelineBoard`, `DealDetailPage`) live inside `apps/web/src/modules/<module>/` mirroring the backend's module boundaries, so a frontend developer working on Pipeline never needs to touch files inside Recruitment's folder.
- **Container/Presentational split**: data-fetching and mutation logic lives in container components/hooks (`useDealDetail`); presentational components receive data via props only and contain no direct API calls — this is what makes the Storybook-driven component library (used for the design system) possible without mocking a full API layer.
- Shared Kanban interaction logic (drag-drop, mobile swipe-fallback, keyboard equivalent) is extracted into a **single reusable `KanbanBoard` component** in `ui-components`, configured per module (Leads, Pipeline, Recruitment) rather than three separately-built boards — directly operationalizing the UX spec's "Kanban modules share identical interaction patterns" rule at the code level, not just the design level.

### 7.3 Cross-Module Communication
- In-process, via application service interfaces (TypeScript interfaces, dependency-injected) — never direct repository imports across module boundaries, enforced by the lint boundary rules in Section 4.3.
- Async, via the event bus for anything another module reacts to but doesn't need synchronously (e.g., Automation reacting to `deal.won`).

---

## 8. Error Handling

### 8.1 Error Taxonomy
| Error Class | Example | HTTP/GraphQL Treatment |
|---|---|---|
| **Validation Error** | Missing required field, invalid format | 400 / field-level GraphQL error, no partial mutation applied |
| **Authorization Error** | Permission denied | 403 / GraphQL error with `code: FORBIDDEN`, field omitted rather than erroring where possible |
| **Not Found** | Record doesn't exist or is soft-deleted | 404 / `code: NOT_FOUND` |
| **Conflict** | Optimistic concurrency version mismatch, duplicate unique key | 409 / `code: CONFLICT`, includes latest server state for client-side merge UX |
| **Business Rule Violation** | Stage requires close date, insufficient permissions for an action's scope | 422 / `code: BUSINESS_RULE_VIOLATION`, human-readable message |
| **Rate Limited** | Too many requests | 429 / includes `Retry-After` |
| **Upstream/Dependency Failure** | Payment provider timeout, LLM provider error | 502/503 / `code: UPSTREAM_ERROR`, retried per idempotency rules where safe |
| **Internal Error** | Unhandled exception | 500 / generic message only, full detail logged server-side with correlation ID, never leaked to client |

### 8.2 Standard Error Envelope (REST & GraphQL)
```
{
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "This stage requires a close date.",
    "field": "expectedCloseDate",
    "correlationId": "..."
  }
}
```
Every error includes a `correlationId` matching the request's trace ID (Section 13), so a user-reported error can be located instantly in logs without asking "what were you doing when this happened."

### 8.3 Handling Principles
- **Fail loudly server-side, fail gracefully client-side.** Internal errors are never swallowed in logs, but the client always receives an actionable, non-technical message (directly implementing the UX spec's error-state philosophy).
- **No silent partial success.** A mutation either fully succeeds or fully fails — no "created the deal but the notification silently failed" ambiguity; side effects that can legitimately fail independently (like notification delivery) are decoupled via the event bus specifically so their failure doesn't roll back the primary transaction, and instead surface separately in `notifications.delivery_logs` for retry.
- **Domain layer throws typed domain exceptions** (e.g., `InsufficientStageRequirementsError`), caught and translated to the appropriate API error shape at the interface layer — the domain layer itself has no knowledge of HTTP/GraphQL error formats.
- **Optimistic UI rollback is explicit**, per the `version` column's optimistic concurrency design — a rejected write returns the current server state so the client can either auto-merge or prompt the user, mirroring the "merge conflict" UX defined for Projects/Tasks.

---

## 9. Validation Strategy

### 9.1 Layered Validation
1. **Client-side (UX layer):** Immediate, non-authoritative feedback for obvious errors (empty required field, malformed email) — purely for responsiveness, never trusted as the source of truth.
2. **API/Interface layer:** Schema validation against the GraphQL schema types / REST request schemas (using a schema library like Zod) — rejects malformed requests before they reach application logic.
3. **Application layer:** Business-rule validation requiring domain context (e.g., "this stage requires a close date," "commission plan can't have overlapping effective date ranges") — this is where most functional-requirement validation actually lives, since it depends on loaded entity state, not just request shape.
4. **Database layer:** Final backstop — `NOT NULL`, `CHECK`, unique constraints as defined in the Database Schema doc. The database is never relied upon as the *primary* validation layer (poor error messages, harder to test), but every invariant that matters is still enforced there in case application-layer validation is ever bypassed or buggy.

### 9.2 Shared Validation Schemas
- Zod (or equivalent) schemas defined once per DTO in `packages/event-contracts`, imported by both the API layer (request validation) and the frontend (client-side pre-validation) — eliminates validation-logic drift between client and server, a common source of confusing "it works on the form but fails on submit" bugs.

### 9.3 Tenant-Isolation Validation (Security-Critical)
- Automated CI test suite specifically attempts cross-tenant reads/writes (using Tenant A's auth context to request Tenant B's record IDs) against every GraphQL resolver and REST endpoint on every PR that touches a resolver/controller — this operationalizes the Architecture Blueprint's Section 12.2 requirement as a concrete, always-running test gate rather than a one-time audit.

---

## 10. Testing Strategy

### 10.1 Test Pyramid
```
        ▲  E2E (Playwright) — critical user journeys only
       ▲▲▲ Integration — module boundaries, DB, event bus
     ▲▲▲▲▲ Unit — domain logic, application handlers
```

### 10.2 Unit Tests
- **Domain layer:** 100% coverage target for business rules (probability calculations, commission rule evaluation, invoice status transitions) — pure functions, fast, no mocks needed since domain has no I/O dependencies by design.
- **Application layer:** Command/query handlers tested with mocked repositories/infrastructure, verifying correct orchestration (authorize → validate → persist → emit event) sequence.

### 10.3 Integration Tests
- Run against a real (containerized, ephemeral) Postgres instance with RLS enabled — critical, since RLS behavior cannot be meaningfully tested against a mocked database.
- Verify: repository correctness, RLS tenant-isolation (the adversarial cross-tenant test suite from Section 9.3 lives here), event bus publish/consume round-trips, and webhook signature verification.

### 10.4 End-to-End Tests
- Cover the critical paths identified in the UX Specification as highest-risk: the Kanban drag-drop interaction (and its keyboard equivalent) across Leads/Pipeline/Recruitment, the Lead → Contact + Deal conversion flow, the Deal Won → Invoice → Payment flow, and the AI Assistant's confirm-before-execute action flow.
- Run against a seeded, disposable tenant per test run — never against shared staging data, to keep tests deterministic and parallelizable.

### 10.5 Non-Functional Testing
- **Load testing:** simulated multi-tenant traffic (including a "noisy neighbor" tenant generating disproportionate load) run before every major release, validating the performance budgets in Section 2 hold under realistic concurrent tenancy — not just single-tenant benchmarks.
- **Accessibility testing:** automated axe-core scans in CI on every PR touching `ui-components`, plus manual screen-reader passes on the Kanban, Automation Builder, and Permission Matrix screens ahead of each release (the three screens flagged in the UX spec as needing explicit accessible-alternate modes).
- **Security testing:** SAST/dependency scanning on every PR; scheduled penetration testing pre-launch and annually thereafter, per the Architecture Blueprint's compliance section.

### 10.6 Test Data & Fixtures
- Fixture factories (not hand-written JSON fixtures) per domain entity, so tests can generate valid-by-construction test data (`buildDeal({ stage: 'won' })`) that stays in sync with schema changes automatically rather than rotting as the schema evolves.

---

## 11. Deployment Architecture

### 11.1 Environments
```
Local (docker-compose) → CI (ephemeral) → Staging → Production (per-region)
```
- **Staging** mirrors production topology at reduced scale, seeded with realistic multi-tenant synthetic data (never real customer data).
- **Production** deployed per-region for dedicated-instance/enterprise tenants requiring data residency (per the Architecture Blueprint's multi-region readiness note); shared-tier tenants served from a primary region with the option to expand.

### 11.2 Deployment Topology
- **Core API:** containerized (Docker), orchestrated via Kubernetes (or ECS as a lighter-weight equivalent pre-Series-A), horizontally scaled based on CPU/request-latency metrics, entirely stateless (sessions in Redis, not in-memory).
- **Web/Portal apps:** deployed via a CDN-fronted static/SSR hosting platform (e.g., Vercel or equivalent Next.js-native hosting) for edge-cached performance.
- **Background workers:** separate deployment unit from the API (distinct scaling profile — worker pool scales on queue depth, not request volume), consuming from the durable job queue.
- **Database:** managed Postgres (e.g., RDS/Cloud SQL) with automated read-replica provisioning; dedicated-instance tenants provisioned onto isolated database instances via the same Terraform modules used for shared infrastructure, so isolation tier is a configuration input, not a separate codebase.

### 11.3 Release Strategy
- **Feature flags** (per the Architecture Blueprint's `platform.feature_flags` table) gate incomplete/risky features in production, decoupling deploy from release.
- **Blue-green or rolling deployment** for the API layer — zero-downtime deploys are a hard requirement given the multi-tenant blast radius of any deployment mistake.
- **Database migrations** run as a distinct, gated pipeline step before application deployment, using expand-contract migration patterns (add new column/table → deploy code that writes both old and new → backfill → deploy code that reads only new → drop old) for any breaking schema change, so a migration never requires simultaneous downtime with a deploy.

---

## 12. CI/CD Recommendations

### 12.1 Pipeline Stages
```
1. Lint + Type-check (fail fast, < 2 min)
2. Unit tests (parallelized per module)
3. Build (all apps/services)
4. Integration tests (against ephemeral containerized Postgres + Redis)
5. Security scans (SAST, dependency/SCA)
6. Accessibility scan (axe-core, on UI package changes)
7. Deploy to Staging (automatic, on merge to main)
8. E2E smoke suite (against Staging)
9. Manual approval gate → Deploy to Production
10. Post-deploy smoke test + automated rollback trigger on failure
```

### 12.2 Recommendations
- **Monorepo-aware pipeline** (e.g., Turborepo/Nx build graph) — only rebuild/retest modules affected by a given PR's changes, essential once the modular monolith has 12+ modules and full-repo CI would otherwise become a bottleneck.
- **Required status checks** before merge: lint, type-check, unit tests, integration tests, tenant-isolation adversarial test suite (non-negotiable, per Section 9.3), and the boundary/dependency-direction lint rule from Section 4.3.
- **Canary deploys** for the core API once traffic volume justifies it — route a small percentage of production traffic to the new version, auto-rollback on elevated error rate before full rollout.
- **Database migration safety check** as an explicit CI step: lint migrations for patterns known to lock large tables (e.g., adding a `NOT NULL` column without a default on a large existing table) before they can merge.
- **Preview environments** per PR for the web app (ephemeral, seeded with synthetic tenant data) so reviewers can interact with UI changes directly rather than reviewing code alone — particularly valuable given the UX-heavy nature of this product.

---

## 13. Monitoring and Observability

### 13.1 Three Pillars
- **Logs:** structured JSON, correlation ID on every log line, shipped to a centralized aggregator (Datadog/ELK-equivalent). Retained per the operational-logging policy distinct from the immutable audit trail (Architecture Blueprint Section 13.1).
- **Metrics:** RED metrics (Rate, Errors, Duration) per API endpoint/resolver, per module, per tenant tier — critical for spotting a "noisy neighbor" tenant or a single module's regression without it being masked by aggregate platform-wide numbers.
- **Traces:** distributed tracing (OpenTelemetry) with correlation IDs threading through synchronous requests, background jobs, and event bus messages — enabling full request-to-completion tracing across the modular monolith even before any module is extracted into a separate service.

### 13.2 Key Dashboards
- **Platform health:** p50/p95/p99 latency per endpoint, error rate, active tenant count, background job queue depth/lag.
- **Per-module health:** since modules are logically independent, each gets its own health dashboard (not buried in an aggregate) — mirrors the Analytics module's own "isolate failure per widget" design principle applied to the engineering team's own observability.
- **Business-health:** AI usage/cost per tenant (governance metric from the Architecture Blueprint's AI section), automation execution failure rate, webhook delivery failure rate.

### 13.3 Alerting
- Alert on **SLO burn rate**, not raw threshold breaches alone (e.g., alert when error budget is being consumed faster than sustainable, not just "error rate > 1%") — reduces alert fatigue while still catching real degradations early.
- Separate alert routing for **security-relevant events** (repeated auth failures, RLS policy violation attempts, impersonation session starts) directly to a security on-call channel, distinct from general operational alerts.
- Every alert links directly to a corresponding runbook (Section 14) — an alert without a linked remediation runbook is considered incomplete and blocked from being added to the on-call rotation.

### 13.4 Runbooks
Stored in `docs/runbooks/`, one per common incident class: database failover, elevated API error rate, background job queue backup, webhook delivery storm, suspected cross-tenant data exposure (the highest-severity runbook in the system, given the multi-tenant architecture's blast radius).

---

## 14. Backup and Disaster Recovery

### 14.1 Backup Strategy
- **Database:** automated continuous WAL archiving + daily full snapshots, retained per a tiered policy (30 days rolling, monthly snapshots retained 1 year for compliance-relevant tenants). Dedicated-instance tenants may contractually require longer/region-pinned retention.
- **Object storage (files):** versioned bucket storage (already required by the file-versioning feature itself) with cross-region replication for enterprise-tier tenants.
- **Audit trail:** given its compliance role, backed up with the same rigor as primary transactional data, never treated as "just logs."

### 14.2 Recovery Objectives
| Tier | RPO (Recovery Point Objective) | RTO (Recovery Time Objective) |
|---|---|---|
| Shared tier | < 15 minutes | < 4 hours |
| Dedicated schema | < 5 minutes | < 2 hours |
| Dedicated instance / Enterprise | < 1 minute (near-continuous replication) | < 1 hour (contractually negotiable) |

### 14.3 Disaster Recovery Testing
- **Quarterly DR drills**: restore a production snapshot into an isolated environment and verify application functionality end-to-end — a backup that has never been test-restored is treated as equivalent to not having a backup.
- **Tenant-level restore capability**: because tenant data is either RLS-scoped (shared tier) or physically isolated (dedicated tiers), the platform must support restoring a *single tenant's* data from backup without affecting co-located tenants — a distinctly multi-tenant DR requirement beyond generic whole-database restore.

### 14.4 Business Continuity
- Multi-AZ deployment as the baseline (non-negotiable even pre-Series-A) so a single availability zone failure doesn't cause an outage.
- Multi-region failover as a roadmap item tied to enterprise/white-label contractual commitments, using the same region-pinning mechanism already established for dedicated-instance tenants (Architecture Blueprint Section 10.1/11.4).
- A documented, rehearsed **incident communication plan** (status page, tenant notification templates via the Notification Architecture itself) so a major incident is communicated to affected tenants promptly and consistently, not improvised in the moment.

---

## Appendix: Traceability Summary

This TDD is designed to be read alongside, not instead of, the three prior documents:

| Prior Document | What This TDD Adds |
|---|---|
| Architecture Blueprint | Concrete coding/API/naming standards implementing its module and layering decisions |
| UX Specification | Component architecture (shared `KanbanBoard`, container/presentational split) that makes the specified interaction consistency actually enforceable in code, not just designed |
| Database Schema Design | Validation layering and migration/CI practices that keep application code and schema evolution safe and in sync |

*This document is the canonical development blueprint. Any deviation from it in a PR should be accompanied by an ADR explaining why, filed in `docs/architecture-decision-records/`.*
