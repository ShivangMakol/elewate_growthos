# Elewate GrowthOS — Platform Architecture Blueprint

**Prepared as a CTO-level architecture brief for Series A readiness**
**Author role:** Principal Software Architect
**Document status:** Foundational architecture — pre-implementation

---

## 1. Product Vision

Elewate GrowthOS is the operating system for growth-stage service businesses — a single platform that unifies revenue generation (CRM, Leads, Pipeline), delivery (Projects, Recruitment, Client Portal), money (Invoicing, Commissions), and intelligence (AI Assistant, Analytics, Automation) under one tenant-isolated, white-labelable product.

**Strategic framing:**
- **Phase 0 (Internal):** Elewate Studio runs its own agency operations on GrowthOS — this is the design partner and the proving ground.
- **Phase 1 (Multi-tenant SaaS):** Onboard external businesses as isolated tenants, self-serve or sales-assisted.
- **Phase 2 (White-label):** Partners rebrand GrowthOS entirely (custom domain, logo, color scheme, terminology) and resell it to their own clients — a "tenant of tenants" model.

**Product principles:**
1. **AI-first, not AI-bolted-on** — every module exposes structured context an AI layer can reason over; the assistant is a first-class citizen with its own architectural plane, not a chatbot widget.
2. **Automation-first** — every entity change is an event; workflows are a native primitive, not an integration afterthought.
3. **Modular by contract** — modules communicate through well-defined interfaces/events so any module can be disabled, licensed separately, or white-labeled independently.
4. **Tenant isolation is non-negotiable** — data, config, branding, and even compute can be isolated per tenant tier.
5. **Boringly reliable core, exciting edges** — the ledger, auth, and tenancy layers are conservative and battle-tested; AI and automation are where innovation happens.

---

## 2. Architecture Overview

### 2.1 Architectural Style
A **modular monolith with service-ready boundaries**, evolving into selectively extracted microservices as scale demands (event-driven extraction, not a rewrite).

Rationale: At Series A stage, a distributed microservices architecture creates operational overhead the team cannot yet justify. Clean architecture + DDD module boundaries mean any module can be extracted into its own service later **without a rewrite** — only a deployment topology change.

### 2.2 High-Level Layers (Clean Architecture)

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer                                      │
│  Web App (Next.js) · Mobile App (React Native) · Public  │
│  API Gateway · White-label Renderer                      │
├─────────────────────────────────────────────────────────┤
│  API / Interface Layer                                   │
│  REST + GraphQL Gateway · Webhooks In/Out · WebSocket Hub │
├─────────────────────────────────────────────────────────┤
│  Application Layer (Use Cases / CQRS Handlers)            │
│  Commands · Queries · Application Services · DTOs        │
├─────────────────────────────────────────────────────────┤
│  Domain Layer (Core Business Logic)                       │
│  Entities · Value Objects · Domain Events · Aggregates   │
│  Domain Services · Business Rules (per Bounded Context)   │
├─────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                     │
│  Repositories · ORM · Cache · Queue · Storage · 3rd-party │
├─────────────────────────────────────────────────────────┤
│  Platform Layer (Cross-Cutting)                            │
│  Multi-Tenancy · IAM/RBAC · Audit · Automation Engine ·   │
│  AI Orchestration · Notification Bus · Event Bus          │
└─────────────────────────────────────────────────────────┘
```

Dependency rule: outer layers depend inward only. Domain layer has zero framework dependencies — this is what makes modules portable to microservices later.

### 2.3 Macro Architecture Diagram (Textual)

```
                     ┌────────────────────┐
                     │   CDN / Edge (WAF)  │
                     └─────────┬───────────┘
                               │
                  ┌────────────▼────────────┐
                  │   API Gateway / BFF      │  (tenant resolution,
                  │  (rate limit, authN)     │   authN, routing)
                  └───┬───────────┬──────────┘
                      │           │
         ┌────────────▼─┐     ┌───▼───────────────┐
         │ Core Services │     │  Event Bus (Kafka/│
         │ (Modular      │◄───►│  SNS+SQS/Redis    │
         │  Monolith)    │     │  Streams)          │
         └───┬───────┬───┘     └───┬──────────┬────┘
             │       │             │          │
      ┌──────▼┐ ┌────▼─────┐ ┌────▼───┐ ┌────▼─────┐
      │Postgres│ │  Redis   │ │Workflow│ │AI Orchestr.│
      │(RLS,   │ │ (cache,  │ │ Engine │ │ Layer      │
      │schema- │ │  session,│ │(automat│ │(LLM Gateway│
      │per-tier)│ │  queues) │ │ -ions) │ │ RAG, tools)│
      └────────┘ └──────────┘ └────────┘ └────────────┘
```

### 2.4 Communication Patterns
- **Synchronous:** REST/GraphQL for client-facing CRUD and reads.
- **Asynchronous:** Domain events (e.g., `lead.converted`, `invoice.paid`) published to an event bus, consumed by Automation Engine, Analytics, Notifications, and AI context indexer.
- **Internal module-to-module:** In-process calls through application service interfaces (not direct repository access) — this is the seam that allows later extraction to network calls without touching domain logic.

---

## 3. Module Breakdown

Each module is a **bounded context** with its own domain model, database schema (logical), and application services. Modules expose:
- A public **application service interface** (used by other modules)
- A set of **domain events** (published to the bus)
- A **permission set** (for RBAC)
- Optional **AI tool definitions** (functions the AI Assistant can invoke)

| Module | Core Responsibility | Key Aggregates | Emits Events |
|---|---|---|---|
| **CRM** | Contacts, companies, relationships | Contact, Company, Relationship | `contact.created`, `company.merged` |
| **Lead Management** | Capture, score, qualify, route leads | Lead, LeadSource, ScoreRule | `lead.created`, `lead.scored`, `lead.qualified` |
| **Sales Pipeline** | Deals, stages, forecasting | Deal, PipelineStage, Quote | `deal.stage_changed`, `deal.won`, `deal.lost` |
| **Projects** | Delivery work, tasks, milestones | Project, Task, Milestone, Sprint | `task.completed`, `project.at_risk` |
| **Recruitment** | Candidate pipeline, job reqs | JobRequisition, Candidate, Interview | `candidate.hired`, `interview.scheduled` |
| **Client Portal** | External-facing client access | PortalUser, SharedAsset, Approval | `approval.requested`, `approval.granted` |
| **Invoicing** | Billing, payments, ledgers | Invoice, LineItem, Payment | `invoice.issued`, `payment.received` |
| **Commission Tracking** | Comp plans, payouts | CommissionPlan, Payout, Rule | `commission.accrued`, `payout.processed` |
| **AI Assistant** | Cross-module reasoning, actions | AssistantSession, ToolCall, Memory | `assistant.action_taken` |
| **Analytics** | Reporting, dashboards, KPIs | Report, Dashboard, Metric | (subscriber only, rarely emits) |
| **Workflow Automation** | Trigger→condition→action engine | Workflow, Trigger, ActionStep | `workflow.executed`, `workflow.failed` |
| **Team Management** | Users, roles, org structure | User, Team, Role, Department | `user.invited`, `role.changed` |

**Cross-cutting platform modules (not business modules):**
- Identity & Access (Auth/RBAC)
- Tenancy & Billing-of-platform (subscription plans for tenants themselves)
- Notification Bus
- Audit & Compliance
- File Storage
- Integration Hub (webhooks, third-party connectors)

**Design rule:** No module directly queries another module's database tables. All cross-module reads go through application service interfaces or a read-optimized query/reporting layer (see Section 7).

---

## 4. Database Domains

### 4.1 Strategy
PostgreSQL as the primary system of record, using **Row-Level Security (RLS)** for tenant isolation combined with a **hybrid schema model** (see Section 10). Each business module owns its own logical schema/namespace even though physically colocated initially.

### 4.2 Domain Boundaries (Logical Schemas)

| Schema | Owns | Notes |
|---|---|---|
| `platform` | tenants, subscriptions, feature_flags, plans | Platform-of-platforms; not tenant-scoped |
| `iam` | users, roles, permissions, sessions, api_keys | Shared identity, tenant-scoped roles |
| `crm` | contacts, companies, relationships, tags | |
| `leads` | leads, lead_sources, scoring_rules, routing_rules | |
| `pipeline` | deals, stages, quotes, forecasts | |
| `projects` | projects, tasks, milestones, sprints, timesheets | |
| `recruitment` | job_requisitions, candidates, interviews, offers | |
| `portal` | portal_users, shared_assets, approvals, comments | |
| `billing` | invoices, line_items, payments, tax_rules | Distinct from platform billing (tenant's own billing of *their* clients) |
| `commissions` | commission_plans, payout_rules, payouts, ledger_entries | |
| `automation` | workflows, triggers, action_steps, execution_logs | |
| `ai` | assistant_sessions, tool_calls, embeddings, memory_snapshots | |
| `analytics` | materialized_reports, dashboard_configs, metric_snapshots | Read-optimized, denormalized |
| `notifications` | notification_templates, delivery_logs, preferences | |
| `audit` | audit_events, change_history | Append-only, immutable |
| `files` | file_metadata, storage_pointers, access_grants | Actual blobs in object storage |

### 4.3 Data Access Pattern
- **Write path:** Domain-driven, transactional, normalized (3NF-ish), enforced via application layer invariants.
- **Read path (reporting/AI/dashboards):** CQRS read models — materialized views or a dedicated analytics store (e.g., ClickHouse/Postgres read replicas) fed by the event bus, so heavy analytical queries never contend with OLTP traffic.

### 4.4 Referential Integrity Across Modules
Cross-module references (e.g., a Deal referencing a Contact) are stored as **soft foreign keys (UUID reference, no DB-level FK constraint across schema boundaries)** to preserve module independence and enable future physical separation. Integrity is enforced at the application layer via domain events and eventual-consistency reconciliation jobs.

---

## 5. Folder Structure

Reflects Clean Architecture + modular monolith with DDD bounded contexts.

```
elewate-growthos/
├── apps/
│   ├── web/                     # Next.js tenant-facing app (white-labelable)
│   ├── admin/                   # Internal super-admin console (platform ops)
│   ├── mobile/                  # React Native app
│   └── portal/                  # Lightweight client-portal SPA (external users)
│
├── services/                    # Deployable units (start as one, split later)
│   └── core-api/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── crm/
│       │   │   │   ├── domain/          # Entities, VOs, domain events, rules
│       │   │   │   ├── application/     # Use cases, commands, queries, DTOs
│       │   │   │   ├── infrastructure/  # Repositories, ORM mappers, adapters
│       │   │   │   └── interface/       # Controllers/resolvers for this module
│       │   │   ├── leads/
│       │   │   ├── pipeline/
│       │   │   ├── projects/
│       │   │   ├── recruitment/
│       │   │   ├── client-portal/
│       │   │   ├── invoicing/
│       │   │   ├── commissions/
│       │   │   ├── ai-assistant/
│       │   │   ├── analytics/
│       │   │   ├── automation/
│       │   │   └── team-management/
│       │   │
│       │   ├── platform/                 # Cross-cutting, shared by all modules
│       │   │   ├── tenancy/
│       │   │   ├── iam/
│       │   │   ├── audit/
│       │   │   ├── notifications/
│       │   │   ├── file-storage/
│       │   │   ├── event-bus/
│       │   │   └── ai-orchestration/
│       │   │
│       │   ├── shared-kernel/            # Truly shared VOs (Money, Email, Address)
│       │   └── bootstrap/                # DI container, app wiring, config loading
│       │
│       └── test/
│
├── packages/                     # Shared libraries across apps/services
│   ├── ui-components/            # Design system (white-label themeable)
│   ├── api-client-sdk/            # Typed client for web/mobile
│   ├── event-contracts/           # Shared event/DTO schemas (versioned)
│   ├── permissions-schema/        # RBAC permission definitions
│   └── config/                    # Shared lint/tsconfig/build config
│
├── infra/
│   ├── terraform/                 # IaC: VPC, DB, cache, queues, CDN
│   ├── k8s/ (or ecs/)              # Deployment manifests per environment
│   └── ci-cd/
│
└── docs/
    └── architecture-decision-records/
```

**Rule of thumb:** a module folder should be deletable wholesale without breaking the compile of unrelated modules (aside from the shared-kernel and platform layers).

---

## 6. API Strategy

### 6.1 Hybrid REST + GraphQL
- **GraphQL** as the primary contract for the web/mobile clients — ideal for the highly relational, multi-module dashboards (e.g., a deal page pulling contact, project, invoice, and AI-suggestion data in one query).
- **REST** for: webhooks (inbound/outbound), third-party integrations, and the public partner API (white-label partners building on top of GrowthOS) — REST is more universally consumable for external developers.
- **A single API Gateway / BFF** resolves tenant context, applies auth, rate limiting, and request shaping before routing to either surface.

### 6.2 Versioning
- REST: URI versioning (`/v1/`, `/v2/`) with a deprecation window policy (min. 12 months).
- GraphQL: Schema evolves additively (never breaking); deprecated fields marked with `@deprecated` directive; breaking changes ship as a new named schema (`schema-v2`) behind the gateway.

### 6.3 API Design Principles
- Resource-oriented, tenant-scoped implicitly (tenant never appears in the URL — it's derived from the auth token/subdomain, preventing tenant-ID guessing attacks).
- **Idempotency keys** required on all mutating endpoints (critical for invoicing/payments).
- **Cursor-based pagination** everywhere (offset pagination banned — doesn't scale, breaks under concurrent writes).
- **Field-level permission filtering** at the resolver/controller layer — the API never returns fields a role isn't entitled to, rather than trusting the client to hide them.
- **Webhooks out:** every domain event optionally fires a tenant-configured outbound webhook (signed with HMAC, retried with exponential backoff, dead-lettered after N failures).
- **Rate limiting:** tiered by subscription plan, enforced at the gateway (token bucket per tenant + per API key).

### 6.4 Internal Module APIs
Modules never call each other's HTTP endpoints internally (avoids network overhead + tight coupling to deployment topology). They interact via in-process application service interfaces today, which can be swapped for gRPC calls transparently if a module is later extracted to its own service.

---

## 7. State Management Strategy

### 7.1 Client-Side (Web/Mobile)
- **Server state:** managed by a query-caching layer (React Query/Apollo Client) — treated as the source of truth for anything from the API; no duplication into global client state.
- **UI/ephemeral state:** local component state or a lightweight store (Zustand/Jotai) — modals, wizard steps, form drafts, optimistic UI flags.
- **Cross-cutting client state:** current tenant/branding theme, current user/session, feature flags — held in a small global context, hydrated once at app boot.
- **Optimistic updates** for high-frequency interactions (drag-drop pipeline stages, task status changes) with automatic rollback on server rejection.

### 7.2 Server-Side
- **CQRS-lite:** Commands mutate the write model (normalized Postgres); Queries for dashboards/reports hit denormalized read models refreshed via event bus consumers — avoids expensive joins across module schemas on every page load.
- **Distributed cache (Redis):** session data, permission resolution cache, rate-limit counters, hot-path lookups (tenant config, feature flags). Cache invalidation is event-driven (a `role.changed` event busts the affected permission cache keys).
- **Real-time state (WebSocket/SSE hub):** pipeline board updates, notification badges, AI assistant streaming responses — a dedicated pub/sub channel per tenant to avoid cross-tenant broadcast leakage.

---

## 8. Authentication Strategy

### 8.1 Core Approach
- **OAuth 2.1 / OIDC-based** authentication with short-lived JWT access tokens (10–15 min) + rotating refresh tokens (stored as httpOnly, secure, SameSite cookies for web; secure keystore for mobile).
- **Tenant-aware token claims:** every access token embeds `tenant_id`, `user_id`, `role_ids`, and a `token_version` (for instant revocation on role/security changes).

### 8.2 Supported Identity Methods
- Email/password (Argon2id hashing, breach-password checks via k-anonymity API).
- **SSO/SAML & OIDC** for enterprise tenants (Okta, Azure AD, Google Workspace) — critical for landing larger accounts post-Series A.
- **Magic link** for client-portal external users (lower-friction, no password to manage for occasional users).
- **MFA (TOTP + WebAuthn/passkeys)** — enforced by tenant policy, mandatory for admin/owner roles.

### 8.3 Session & Token Management
- Central **Identity Service** (within `iam` module) issues, refreshes, and revokes tokens.
- Refresh tokens are rotated on every use (rotation-detection to catch token theft — reuse of an old refresh token invalidates the entire session family).
- **Impersonation mode** for platform support staff — heavily audited, time-boxed, requires tenant admin consent flag or contractual support clause.

### 8.4 White-Label Considerations
Each white-label partner can configure their own custom domain with auth pages fully themed; underlying identity provider remains GrowthOS's IAM service (partners are not required to run their own IdP, though enterprise white-label partners may bring their own via OIDC federation).

---

## 9. Authorization Model (RBAC)

### 9.1 Model: RBAC + ABAC Hybrid
Pure role-based access control doesn't handle "a sales rep can only see their own deals" cleanly — so GrowthOS layers **attribute-based rules on top of roles**.

- **Roles** define coarse capability sets (e.g., `Sales Rep`, `Project Manager`, `Recruiter`, `Finance Admin`, `Tenant Owner`, `Platform Super Admin`).
- **Permissions** are granular, module-scoped strings (e.g., `pipeline.deal.read.own`, `pipeline.deal.read.team`, `invoicing.invoice.approve`).
- **Attribute rules** narrow scope dynamically: ownership (`own` vs `team` vs `all`), record-level sharing rules, and territory/department scoping.

### 9.2 Structure

```
Tenant
 └── Roles (custom per tenant, seeded from templates)
      └── Permission Sets (module.resource.action.scope)
           └── Attribute Rules (ownership, hierarchy, custom conditions)
Users → assigned 1..N Roles (+ optional direct permission overrides)
```

### 9.3 Key Design Decisions
- **Permission resolution is cached** (Redis) per user, invalidated on role/permission change events — authorization checks must be sub-millisecond since they run on every request.
- **Field-level and action-level permissions**, not just page-level — e.g., a rep can view a deal but not see its margin field.
- **Delegated administration:** tenant owners manage their own roles/permissions without platform involvement — critical for white-label partners managing their sub-clients.
- **Policy-as-data:** permission rules stored as structured data (not hardcoded conditionals), evaluated by a central Policy Decision Point — enables tenants to customize roles without code changes.
- **Deny-by-default:** absence of an explicit grant is a denial; no implicit access.

---

## 10. Multi-Tenant Design

### 10.1 Isolation Model: Hybrid Tiered Tenancy

| Tier | Data Isolation | Use Case |
|---|---|---|
| **Shared (Starter/Growth)** | Single database, shared schema, **Postgres RLS** enforcing `tenant_id` on every row | Majority of SMB tenants — cost-efficient |
| **Dedicated Schema (Business)** | Schema-per-tenant within shared DB cluster | Mid-market tenants needing stronger isolation/compliance |
| **Dedicated Instance (Enterprise/White-label)** | Fully isolated database instance (and optionally isolated compute) | Large enterprise + white-label partners reselling under their own brand |

This tiered model lets the platform **start simple (shared RLS) and scale isolation up per customer contract** without re-architecting — a routing layer (Tenant Resolver Service) decides, per request, which physical data plane to hit based on `tenant_id → tier mapping`.

### 10.2 Tenant Resolution
- Resolved from subdomain (`acme.growthos.app`) or custom domain (white-label: `growth.acmeagency.com` via CNAME + TLS cert automation) at the edge/gateway, attached to the request context, and propagated through every downstream call (including async jobs and event bus messages, which always carry `tenant_id` in their envelope).

### 10.3 Tenant-Scoped Everything
- Database rows, cache keys, queue messages, file storage paths, search indices, and WebSocket channels are **all namespaced by tenant_id** — no shared resource lacks a tenant boundary. This is enforced structurally (middleware/interceptors inject tenant filters automatically) rather than left to developer discipline.

### 10.4 White-Label Support
- Per-tenant theming (logo, colors, typography, terminology overrides — e.g., "Deals" → "Opportunities"), custom domain + SSL automation, tenant-level email sending domains (DKIM/SPF per tenant), and a **partner tier** that allows a white-label reseller to provision and manage their own sub-tenants (multi-level tenancy: Platform → Partner → Partner's Clients).

### 10.5 Tenant Provisioning
Automated onboarding pipeline: tenant record created → schema/RLS policies applied → default roles seeded → sample data (optional) → billing subscription linked → welcome automation workflow triggered. Fully API-driven so it can be triggered by self-serve signup or an internal sales tool.

---

## 11. Scalability Plan

### 11.1 Horizontal Scaling
- **Stateless application layer** (core-api) behind a load balancer — scales horizontally by adding pods/instances; no in-memory session state (all in Redis).
- **Database:** start with a single primary + read replicas; introduce **tenant-based sharding** once a single cluster's write throughput becomes the bottleneck (shard key = `tenant_id`, so a tenant's data never splits across shards — keeps queries simple).
- **Read/write splitting:** read replicas serve reporting/analytics queries; primary reserved for OLTP writes.

### 11.2 Caching Strategy (Layered)
1. CDN edge cache for static assets and public pages.
2. API-level cache (Redis) for permission resolution, tenant config, feature flags.
3. Application-level query result caching for expensive aggregate reads (dashboards), invalidated by domain events.

### 11.3 Asynchronous Processing
Heavy or non-critical-path work (report generation, bulk email, AI embedding generation, commission recalculation) is offloaded to background workers via a durable queue (SQS/BullMQ/Sidekiq-equivalent) — keeps API response times low and predictable.

### 11.4 Growth Path
```
MVP:        Single region, modular monolith, shared Postgres + RLS
Series A:   Read replicas, Redis cluster, background workers, CDN, 
            basic sharding readiness
Growth:     Tenant-based DB sharding, module extraction for hottest 
            modules (e.g., Analytics, AI) into own services, 
            multi-region read replicas
Scale:      Full microservices for high-load modules, multi-region 
            active-active, dedicated compute tiers for enterprise tenants
```

### 11.5 Performance Budgets
Define and enforce SLOs early: p95 API latency < 300ms for CRUD, < 150ms for cached reads, dashboard load < 2s, background job lag < 60s at 95th percentile — instrumented from day one so regressions are caught before they compound.

---

## 12. Security Model

### 12.1 Defense in Depth
- **Edge:** WAF + DDoS protection (Cloudflare/AWS Shield), TLS 1.3 everywhere, HSTS.
- **Gateway:** authentication, tenant resolution, rate limiting, input validation/schema enforcement before requests reach application code.
- **Application:** RBAC/ABAC enforcement on every mutation and query, output filtering by permission, parameterized queries only (no raw SQL string concatenation), CSRF protection on state-changing web requests.
- **Data:** encryption at rest (AES-256) for databases and file storage; encryption in transit everywhere; **field-level encryption** for highly sensitive data (SSNs, bank details in Commission/Invoicing modules).
- **Secrets:** managed via a dedicated secrets manager (Vault/AWS Secrets Manager) — never in code, env files, or logs.

### 12.2 Tenant Isolation as a Security Boundary
RLS policies tested with automated cross-tenant access attempts in CI (a mandatory security test suite that tries to read tenant B's data using tenant A's credentials on every module, every release).

### 12.3 Application Security Practices
- Dependency scanning (SCA) and SAST in CI/CD pipeline; blocked merges on critical CVEs.
- Regular third-party penetration testing (pre-Series A and annually thereafter — investors and enterprise customers will ask for this).
- **Least privilege** service accounts for all infrastructure components.
- Signed, verifiable webhooks; API keys scoped to specific permissions, not full account access.

### 12.4 Compliance Readiness
Architected to make SOC 2 Type II and GDPR compliance achievable without redesign: audit logging (Section 13), data residency options (tenant-tier dedicated instances can pin to a region), right-to-erasure workflows, and data processing agreements support baked into the tenant offboarding flow.

---

## 13. Logging and Audit Design

### 13.1 Two Distinct Systems
1. **Operational logging** (structured JSON logs, correlation IDs per request, shipped to a log aggregator like Datadog/ELK) — for debugging and observability. Retained short-to-medium term.
2. **Audit trail** (append-only, immutable, in the `audit` schema) — for compliance and security forensics. Every sensitive action (login, permission change, record deletion, invoice modification, data export, impersonation) is recorded with: actor, tenant, timestamp, before/after state (diff), IP/device metadata, and correlation ID. Retained per compliance requirements (often 1–7 years).

### 13.2 Design Principles
- Audit events are emitted as domain events too, consumed by a dedicated append-only writer — never bypassable by application code, and never mutable once written (write-once storage or a hash-chained log for tamper evidence).
- Tenant admins get a **self-service audit log viewer** (a differentiator vs. many SMB tools) scoped strictly to their own tenant.
- Correlation IDs thread through synchronous requests, async jobs, and event bus messages, enabling full request tracing across the modular monolith (and later, across extracted services).

---

## 14. Notification Architecture

### 14.1 Central Notification Bus
All modules publish notification *intents* (not final formatted messages) to a central Notification Service, which owns templating, channel selection, and delivery.

```
Domain Event → Notification Rule Match → Template Render 
  → Channel Fan-out (Email / SMS / Push / In-App / Slack) 
  → Delivery Log → Retry/Fallback
```

### 14.2 Channels
- **In-app** (real-time via WebSocket hub, persisted for notification center/inbox).
- **Email** (transactional provider, tenant-brandable templates, tenant-level sending domain for white-label authenticity).
- **Push** (mobile, via APNs/FCM).
- **SMS** (for time-sensitive alerts — interview reminders, payment failures).
- **Chat integrations** (Slack/Teams webhooks — high value for internal team alerts like "deal moved to Won").

### 14.3 User & Tenant Control
Per-user notification preferences (channel + frequency + digest vs. real-time) and per-tenant default policies; unsubscribe/quiet-hours respected; all notification rules configurable through the Workflow Automation module itself, so "notify X when Y happens" is just another automation, not special-cased code.

---

## 15. File Storage Strategy

### 15.1 Architecture
Object storage (S3-compatible) as the backing store, with a **File Metadata Service** (`files` schema) as the system of record for ownership, permissions, versioning, and tenant scoping — the database never stores blobs, only pointers + metadata.

### 15.2 Structure
```
/tenants/{tenant_id}/{module}/{entity_id}/{file_id}-{version}
```
Tenant-prefixed paths + bucket policies enforce isolation at the storage layer itself, not just the application layer (defense in depth).

### 15.3 Key Features
- **Signed, time-limited URLs** for all access (no public buckets, ever) — permission-checked before a signed URL is issued.
- **Virus/malware scanning** on upload (async, quarantine until clean) before a file becomes accessible.
- **Versioning** for documents (contracts, proposals) with diff/history support in Client Portal and Projects modules.
- **Storage tiering:** hot storage for recent/active files, lifecycle rules to move cold files (old invoices, closed project archives) to cheaper cold storage tiers automatically.
- **Per-tenant storage quotas** tied to subscription plan, enforced at upload time.

---

## 16. AI Integration Strategy

### 16.1 Architectural Placement
AI is a **platform-layer capability**, not a bolted-on module — the AI Assistant module is the user-facing surface, but an **AI Orchestration Layer** underneath is consumable by every module (e.g., Lead Scoring in `leads`, deal-risk prediction in `pipeline`, candidate-matching in `recruitment` all call the same orchestration layer).

```
┌────────────────────────────────────────────┐
│              AI Assistant (UX)               │
├────────────────────────────────────────────┤
│         AI Orchestration Layer               │
│  - LLM Gateway (provider-agnostic)           │
│  - Tool/Function Registry (per module)       │
│  - RAG Pipeline (tenant-scoped retrieval)     │
│  - Guardrails (PII redaction, cost caps,      │
│    tenant data-leak prevention)               │
│  - Memory Store (per-user, per-tenant)        │
├────────────────────────────────────────────┤
│  Module-Level AI Tools (function definitions) │
│  e.g. "create_task", "score_lead",            │
│  "draft_invoice_reminder", "summarize_deal"   │
└────────────────────────────────────────────┘
```

### 16.2 Core Capabilities
- **Conversational Assistant:** natural-language interface across all modules ("Summarize my open deals this week", "Draft a follow-up to this candidate") — implemented via a **tool-calling agent** where each module registers safe, permission-checked functions the LLM can invoke.
- **Embedded Intelligence:** lead scoring, deal win-probability, project risk flags, candidate-job matching, invoice anomaly detection — as background AI jobs, not just chat.
- **RAG (Retrieval-Augmented Generation):** tenant-scoped vector index (`ai.embeddings`) built from CRM/project/portal data, strictly filtered by `tenant_id` at the vector-store query level (never rely on prompt instructions alone for tenant isolation — enforce it structurally).
- **Provider-agnostic LLM Gateway:** abstraction over model providers (allows swapping/routing between models by cost/capability/data-residency needs — important since some tenants may require specific model/region guarantees).

### 16.3 Safety & Governance
- Every AI tool call is **permission-checked as if the user performed it directly** — the AI has no elevated privileges.
- All AI actions are logged in the audit trail with a distinct `actor_type: ai_assistant`.
- PII/sensitive-field redaction before any data leaves the tenant boundary to an external model provider (configurable per tenant — enterprise tenants can restrict to on-prem/VPC-hosted models).
- Cost governance: per-tenant AI usage quotas and cost tracking, since LLM calls are a variable cost center tied directly to subscription tier.

---

## 17. Automation Architecture

### 17.1 Core Engine: Trigger → Condition → Action
A dedicated **Workflow Automation module** provides a no-code rule engine usable by tenant admins and internally by the platform team.

```
Trigger (domain event, schedule, or manual)
   → Condition Evaluation (rule expressions on event payload/entity state)
      → Action Step(s) (sequential or branching: update record, 
         send notification, call AI tool, call webhook, create task, 
         wait/delay, branch on condition)
```

### 17.2 Design Details
- **Triggers** subscribe to the same domain event bus every other module consumes from — automation is not a special integration, it's just another event subscriber.
- **Actions** are implemented as a registry of typed "action handlers" per module (e.g., `pipeline.create_deal`, `notifications.send`, `ai.summarize`) — extensible without touching the engine core.
- **Execution is durable and idempotent:** each workflow run is persisted (`automation.execution_logs`) with step-by-step state, enabling retry-from-failure rather than full re-run, and providing tenant admins visibility into "why did this automation not fire."
- **Rate/loop protection:** cycle detection and per-tenant execution caps prevent runaway automations (e.g., an automation that updates a record which re-triggers itself).
- **Versioning:** workflow definitions are versioned; in-flight executions continue on the version they started with when a tenant edits a live workflow.

### 17.3 Builder UX Implication
Because actions/conditions are data-driven (stored as structured JSON rule trees, not code), the front-end can offer a visual drag-and-drop builder without backend changes per new automation type — new capabilities are added by registering new action/trigger types, not shipping new UI logic each time.

---

## 18. Performance Optimizations

- **N+1 prevention:** GraphQL resolvers use DataLoader-style batching by default; code review gate blocks any per-item DB call inside a loop.
- **Materialized views / read models** for dashboard and analytics queries instead of live aggregation joins across module schemas.
- **Database indexing strategy** reviewed per module at design time (not retrofitted) — every `tenant_id` + frequently-filtered-column combination gets a composite index; RLS-filtered queries are indexed with `tenant_id` as the leading column.
- **Connection pooling** (PgBouncer or equivalent) — critical once tenant count grows, since naive per-tenant connections don't scale.
- **Background job prioritization:** critical-path jobs (payment processing, notification delivery) separated into their own queues from best-effort jobs (analytics recompute, AI embedding refresh) so noisy tenants/jobs can't starve time-sensitive work.
- **Payload shaping:** GraphQL persisted queries / REST sparse fieldsets to avoid over-fetching, especially important for mobile clients on constrained networks.
- **Progressive/lazy loading** on mobile and web for heavy views (pipeline boards, analytics dashboards) — skeleton states + incremental data fetch rather than blocking full-page loads.
- **Continuous load testing** against realistic multi-tenant traffic patterns (noisy-neighbor simulation) before major releases.

---

## 19. Future Expansion Strategy

### 19.1 Product Expansion
- **Marketplace/App Store:** allow third-party developers to build add-on modules against the same application-service/event contracts used internally — the modular architecture is what makes this possible without a separate "public API v2" effort later.
- **Vertical-specific templates:** pre-configured module sets and automations for specific industries (agencies, recruitment firms, consultancies) as a packaging/GTM layer on top of the same core.
- **Deeper AI agentic workflows:** move from "assistant that answers/suggests" to "agent that autonomously executes multi-step processes" (e.g., full lead-to-invoice automation with human-in-the-loop approval checkpoints), building on the same tool-registry foundation from day one.

### 19.2 Technical Expansion
- **Microservice extraction path:** highest-load/most-independently-scaling modules (Analytics, AI Orchestration, Notifications) are the natural first candidates for extraction — their event-bus-based interfaces mean this is a deployment change, not a redesign.
- **Multi-region active-active:** for enterprise/white-label tenants requiring data residency or geographic latency guarantees — the tenant-tiered isolation model (Section 10) already provides the seam (dedicated-instance tenants can be pinned to a region from day one).
- **Open API ecosystem:** the REST partner API (Section 6) matures into a full public developer platform with OAuth app installs, akin to how HubSpot/Salesforce built their ecosystems — a meaningful long-term moat and stickiness lever.
- **Embedded/White-label SDKs:** expose UI component packages (from the design system in `packages/ui-components`) so white-label partners can embed GrowthOS functionality directly into their own products, not just rebrand the full app.

### 19.3 Business Model Expansion
- Usage-based add-ons (AI credits, storage tiers, premium automation runs) layered on top of seat-based subscription pricing.
- Partner/reseller tier formalized as a first-class tenancy level (Section 10.4) enabling a channel-based go-to-market, not just direct sales — a meaningful revenue-multiplier post-Series A.

---

## Appendix: Key Architectural Decisions Summary

| Decision | Choice | Primary Reason |
|---|---|---|
| Monolith vs. Microservices | Modular monolith → selective extraction | Speed to market now, clean seams for later |
| Tenant isolation | Tiered (RLS → schema → dedicated instance) | Cost-efficient at SMB scale, compliant at enterprise scale |
| API style | REST + GraphQL hybrid | Right tool per consumer (internal clients vs. external partners) |
| Authorization | RBAC + ABAC hybrid | Role simplicity + record-level real-world nuance |
| AI placement | Platform-layer orchestration, not a module silo | Reusable across every business module |
| Automation | Event-bus-driven rule engine | No-code extensibility without core changes |
| Database | PostgreSQL + RLS + read replicas/CQRS | Mature, strong isolation primitives, cost-effective at this stage |

---

*This document is intended as the foundational architecture reference for engineering, security review, and investor technical due diligence. It should evolve into living Architecture Decision Records (ADRs) as implementation begins.*
