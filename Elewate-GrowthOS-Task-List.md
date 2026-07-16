# Elewate GrowthOS — Milestone Task List

**Derived from:** Elewate-GrowthOS-Implementation-Roadmap.md
**Format:** Each milestone is independently deployable — when its checklist is complete, it can ship to production as a working (if narrow) release, not just a merged branch.
**No code included** — this is a build checklist only.

> Numbering follows the roadmap's dependency order (Section 4/7). M0 is mandatory and blocking for everything; M1–M13 are otherwise sequential except where marked "parallel-track eligible."

---

## M0 — Platform Foundation & Auth

**Goal**
- [ ] A tenant can be provisioned, a user can sign up, log in, and receive a tenant-scoped JWT, with RLS enforced and every action audit-logged — with zero business modules yet built.
- [ ] Deployable as: an internal "auth + tenant admin" release. Nothing customer-facing, but a real, live, provisionable system.

**Files to Create**
- [ ] `turbo.json`, root `package.json`, `tsconfig.base.json`
- [ ] `.gitignore`, `.env.example`, `LICENSE`, expanded `README.md`
- [ ] `infra/terraform/` (VPC, RDS, Redis, S3, ECS cluster modules)
- [ ] `infra/ci-cd/` (GitHub Actions workflow files: lint, unit, build, integration, security scan)
- [ ] `services/core-api/src/platform/tenancy/` (domain, application, infrastructure, interface)
- [ ] `services/core-api/src/platform/iam-core/` (domain, application, infrastructure, interface)
- [ ] `services/core-api/src/platform/audit/`
- [ ] `services/core-api/src/platform/event-bus/`
- [ ] `services/core-api/src/platform/file-storage/`
- [ ] `services/core-api/src/platform/notifications/` (skeleton only)
- [ ] `services/core-api/src/shared-kernel/`
- [ ] `services/core-api/src/bootstrap/`
- [ ] `packages/config/` (shared lint/tsconfig)
- [ ] `packages/event-contracts/`
- [ ] `packages/permissions-schema/`
- [ ] `packages/ui-components/` (tokens, theming vars, base primitives only)
- [ ] `db/migrations/0001_platform_schema.sql` (or ORM equivalent)
- [ ] `db/seed/roles_and_permissions.seed.ts`
- [ ] `docs/architecture-decision-records/0001-stack-choices.md`
- [ ] `docs/architecture-decision-records/0002-tenancy-model.md`
- [ ] `apps/web/` (Next.js shell only — no module content)
- [ ] `apps/admin/` (internal super-admin shell)

**Components**
- [ ] Global app shell (top bar, sidebar nav skeleton)
- [ ] Command palette (Cmd+K) shell — no actions wired yet
- [ ] Login / signup / forgot-password screens
- [ ] Tenant provisioning form (super-admin)
- [ ] Base primitives: Button, Input, Drawer, Table shell, Toast, Modal

**Backend**
- [ ] Tenant provisioning service (API-driven, automated)
- [ ] OAuth2.1/OIDC auth flow implementation
- [ ] JWT issuance + refresh token rotation
- [ ] Argon2id password hashing
- [ ] RLS session-binding middleware (`SET LOCAL app.current_tenant_id`, transaction-scoped)
- [ ] RBAC/ABAC permission-check middleware
- [ ] Audit event writer (hash-chained, append-only)
- [ ] Event bus (in-process emitter + typed contract registration)
- [ ] File storage service (S3 pointer pattern, virus-scan hook)
- [ ] Notification bus skeleton (template registry, delivery log — channels stubbed)

**Frontend**
- [ ] Auth pages wired to backend (signup, login, logout, refresh)
- [ ] Tenant switcher (for users in multiple tenants)
- [ ] Global app shell rendering with white-label theming applied from tenant config
- [ ] Empty/loading/error state components (per UX spec shared behaviors)

**Database**
- [ ] `platform.tenants`
- [ ] `iam.users`, `iam.tenant_memberships`, `iam.roles`, `iam.permissions`, `iam.role_permissions`, `iam.user_roles`, `iam.sessions`, `iam.api_keys`
- [ ] `audit.audit_events` (hash-chained, `REVOKE UPDATE/DELETE` enforced at role level)
- [ ] `files.file_metadata`
- [ ] `notifications.templates`, `notifications.delivery_log`
- [ ] RLS policies forced on every tenant-scoped table above
- [ ] Migration rollback scripts for each of the above

**APIs**
- [ ] `POST /auth/signup`
- [ ] `POST /auth/login`
- [ ] `POST /auth/refresh`
- [ ] `POST /auth/logout`
- [ ] `POST /admin/tenants` (provisioning, super-admin only)
- [ ] `GET /me` (current user + tenant + role claims)
- [ ] GraphQL schema: `User`, `Tenant`, `Role`, `Permission` types (queries only at this stage)

**Tests**
- [ ] Unit tests: JWT issuance, password hashing, permission evaluation logic
- [ ] Integration tests: full signup → login → authenticated request round-trip
- [ ] **Adversarial RLS/tenant-isolation test suite** (attempt cross-tenant reads/writes across every tenant-scoped table, confirm all blocked) — this is the hard gate for M0 sign-off
- [ ] Audit log integrity test (hash chain verification, tamper detection)
- [ ] CI pipeline green end-to-end on a clean environment

---

## M1 — Team Management

**Goal**
- [ ] A tenant admin can invite teammates, assign roles, and manage permissions through a real UI — first user-facing module.
- [ ] Deployable as: a standalone "team directory + access control" tool, useful even before any other module exists.

**Files to Create**
- [ ] `services/core-api/src/modules/team-management/{domain,application,infrastructure,interface,__tests__}/`
- [ ] `apps/web/app/(dashboard)/team/` (members list, invite flow, role editor, profile pages)
- [ ] `packages/ui-components/src/kanban/` — *not needed yet, skip; placeholder removed*
- [ ] `db/migrations/0002_team_management.sql` (if any module-specific tables beyond iam.* are needed, e.g. invitation records)
- [ ] `docs/architecture-decision-records/0003-rbac-ui-model.md`

**Components**
- [ ] Members List table (per UX spec)
- [ ] Invite Teammate modal/drawer
- [ ] Roles & Permissions editor (matrix-style UI)
- [ ] My Profile page

**Backend**
- [ ] Invitation service (generate/expire invite tokens, email trigger via notification bus)
- [ ] Role assignment use cases (assign/revoke role, scoped to tenant)
- [ ] Permission matrix query service

**Frontend**
- [ ] Members list wired to live data, with search/filter
- [ ] Invite flow (email input → pending invite state → acceptance)
- [ ] Role editor wired to permission matrix backend
- [ ] Profile edit (name, avatar, notification preferences)

**Database**
- [ ] `iam.invitations` (token, expiry, status)
- [ ] Any additional indexes needed on `iam.user_roles` for the permission matrix UI query pattern

**APIs**
- [ ] `POST /team/invite`
- [ ] `POST /team/invite/:token/accept`
- [ ] `GET /team/members`
- [ ] `PATCH /team/members/:id/roles`
- [ ] `GET /team/roles` / `POST /team/roles` / `PATCH /team/roles/:id`
- [ ] GraphQL: `TeamMember`, `Invitation`, `RoleAssignment` types + mutations

**Tests**
- [ ] Unit: invitation token expiry logic, role-assignment permission checks
- [ ] Integration: full invite → accept → role-assigned flow
- [ ] RBAC enforcement test: a user without `team:manage` permission cannot hit role-mutation endpoints
- [ ] E2E (Playwright): admin invites a teammate, teammate logs in, sees correct scoped nav

---

## M2 — CRM

**Goal**
- [ ] Tenant can create/manage Contacts and Companies with a full activity timeline — first "reference implementation" module other teams pattern-match against.
- [ ] Deployable as: a standalone lightweight CRM/contact database, independently useful.

**Files to Create**
- [ ] `services/core-api/src/modules/crm/{domain,application,infrastructure,interface,__tests__}/`
- [ ] `apps/web/app/(dashboard)/crm/contacts/`, `apps/web/app/(dashboard)/crm/companies/`
- [ ] `db/migrations/0003_crm_schema.sql`
- [ ] `packages/api-client-sdk/src/crm/`

**Components**
- [ ] Contacts table/list view (per UX spec)
- [ ] Contact detail drawer/page with Activity Timeline
- [ ] Companies table/list view + detail page
- [ ] Contact/Company create & edit forms
- [ ] Activity log entry component (call/email/note/meeting types)

**Backend**
- [ ] Contact CRUD use cases
- [ ] Company CRUD use cases
- [ ] Activity timeline write/read use cases
- [ ] Contact-to-Company association logic

**Frontend**
- [ ] Contacts list wired with search/filter/sort
- [ ] Company list wired
- [ ] Contact detail view rendering merged activity timeline
- [ ] Create/edit forms with Zod-backed validation

**Database**
- [ ] `crm.contacts`
- [ ] `crm.companies`
- [ ] `crm.activities`
- [ ] `crm.contact_company_associations` (if many-to-many per schema doc)
- [ ] RLS policies on all above, forced
- [ ] Indexes for search (name, email, company)

**APIs**
- [ ] `GET/POST /crm/contacts`, `GET/PATCH/DELETE /crm/contacts/:id`
- [ ] `GET/POST /crm/companies`, `GET/PATCH/DELETE /crm/companies/:id`
- [ ] `GET/POST /crm/contacts/:id/activities`
- [ ] GraphQL: `Contact`, `Company`, `Activity` types, queries + mutations

**Tests**
- [ ] Unit: contact/company domain validation rules
- [ ] Integration: create contact → log activity → verify timeline order
- [ ] RLS test: cross-tenant contact access blocked
- [ ] E2E: create a company, add a contact linked to it, log an activity, confirm it renders

---

## M3 — Leads

**Goal**
- [ ] Tenant can capture leads, see them scored, move them through a Kanban, and convert a Lead into a Contact + Deal.
- [ ] Deployable as: a lead-capture + qualification tool, standalone or paired with M2.

**Files to Create**
- [ ] `services/core-api/src/modules/leads/{domain,application,infrastructure,interface,__tests__}/`
- [ ] `apps/web/app/(dashboard)/leads/`
- [ ] `packages/ui-components/src/kanban/` (shared Kanban component — built here, first use)
- [ ] `db/migrations/0004_leads_schema.sql`

**Components**
- [ ] Kanban board (shared component — drag-drop, keyboard-operable, mobile swipe fallback)
- [ ] Lead capture form
- [ ] Lead score badge/indicator
- [ ] Lead detail drawer
- [ ] "Convert to Contact + Deal" action flow

**Backend**
- [ ] Lead CRUD use cases
- [ ] Lead scoring engine (rules-based, per TDD FR-L spec)
- [ ] Lead conversion use case (creates `crm.contacts` + `pipeline.deals` records atomically — first real cross-module transaction)

**Frontend**
- [ ] Leads Kanban wired to live data (stage columns)
- [ ] Lead capture form (manual entry; webhook/import intentionally deferred to a later milestone per roadmap open question)
- [ ] Score display + recompute trigger
- [ ] Conversion confirmation flow

**Database**
- [ ] `leads.leads`
- [ ] `leads.lead_score_history` (if scoring is auditable per schema doc)
- [ ] `leads.lead_stages` (or shared stage config pattern, see Pipeline)
- [ ] RLS policies forced
- [ ] Foreign key/event contract to `crm.contacts` and `pipeline.deals` (soft FK per architecture's cross-schema convention)

**APIs**
- [ ] `GET/POST /leads`, `GET/PATCH/DELETE /leads/:id`
- [ ] `PATCH /leads/:id/stage` (Kanban move)
- [ ] `POST /leads/:id/convert`
- [ ] GraphQL: `Lead` type + `convertLead` mutation

**Tests**
- [ ] Unit: scoring engine rule evaluation
- [ ] Integration: full capture → score → stage-move → convert flow
- [ ] **Cross-module transaction test**: conversion either fully succeeds (Contact + Deal both created) or fully rolls back — no partial state
- [ ] E2E: drag a lead card across Kanban columns, keyboard-only equivalent path also tested (a11y)

---

## M4 — Pipeline

**Goal**
- [ ] Full deal management: Kanban pipeline, configurable stages, quotes, forecast view. This is the highest-fan-in module — everything downstream depends on it.
- [ ] Deployable as: a sales pipeline tool; combined with M2/M3 this is a genuinely complete lightweight sales CRM release.
- [ ] **This milestone's completion = "Revenue Spine Complete" (Roadmap Milestone M2).**

**Files to Create**
- [ ] `services/core-api/src/modules/pipeline/{domain,application,infrastructure,interface,__tests__}/`
- [ ] `apps/web/app/(dashboard)/pipeline/deals/`, `.../stages/`, `.../quotes/`, `.../forecast/`
- [ ] `db/migrations/0005_pipeline_schema.sql`

**Components**
- [ ] Deals Kanban (reuses shared Kanban component from M3)
- [ ] Pipeline Stage configuration screen (admin-editable stages)
- [ ] Quote builder/editor
- [ ] Forecast view (chart/table)
- [ ] Deal detail drawer/page

**Backend**
- [ ] Deal CRUD use cases
- [ ] Stage configuration use cases (per-tenant customizable stages)
- [ ] Quote generation/versioning use cases
- [ ] Forecast calculation service
- [ ] "Deal Won" domain event emission (consumed later by Invoicing, Commissions, Projects)

**Frontend**
- [ ] Deals Kanban wired to live data
- [ ] Stage config UI (add/reorder/rename/delete stages, with in-use protection)
- [ ] Quote builder wired to deal context
- [ ] Forecast view wired to aggregation endpoint

**Database**
- [ ] `pipeline.deals`
- [ ] `pipeline.stages`
- [ ] `pipeline.quotes`, `pipeline.quote_line_items`
- [ ] `pipeline.deal_stage_history` (audit trail of stage transitions, if specified)
- [ ] RLS policies forced
- [ ] `source_lead_id` soft FK to `leads.leads`

**APIs**
- [ ] `GET/POST /pipeline/deals`, `GET/PATCH/DELETE /pipeline/deals/:id`
- [ ] `PATCH /pipeline/deals/:id/stage`
- [ ] `GET/POST/PATCH/DELETE /pipeline/stages`
- [ ] `GET/POST /pipeline/quotes`
- [ ] `GET /pipeline/forecast`
- [ ] GraphQL: `Deal`, `Stage`, `Quote` types + mutations

**Tests**
- [ ] Unit: forecast calculation logic, stage-reorder logic
- [ ] Integration: Lead conversion (M3) → Deal appears in Pipeline → moves to Won → domain event fires
- [ ] Event contract test: `DealWon` event payload matches `packages/event-contracts` schema (downstream modules depend on this being stable)
- [ ] **E2E — Revenue Spine test**: invite teammate (M1) → create contact (M2) → capture lead (M3) → convert → move deal to Won (M4). This is the single most important test in the project.

---

## M5 — Projects

**Goal**
- [ ] Projects can be created standalone or auto-generated from a Won deal, with Kanban/List/Gantt views, milestones, and a client-visibility flag.
- [ ] Deployable as: adds delivery/PM capability on top of the sales spine.

**Files to Create**
- [ ] `services/core-api/src/modules/projects/{domain,application,infrastructure,interface,__tests__}/`
- [ ] `apps/web/app/(dashboard)/projects/`
- [ ] `db/migrations/0006_projects_schema.sql`

**Components**
- [ ] Project Kanban view (reuses shared Kanban)
- [ ] Project List view
- [ ] Project Gantt view
- [ ] Milestone tracker component
- [ ] "Client visible" toggle control

**Backend**
- [ ] Project CRUD use cases
- [ ] `DealWon` event subscriber → auto-create project use case
- [ ] Milestone CRUD use cases
- [ ] Task/subtask use cases (if in schema)

**Frontend**
- [ ] Project views (Kanban/List/Gantt) wired to live data, view-switcher
- [ ] Milestone management UI
- [ ] Client-visibility toggle wired to Client Portal exposure rules

**Database**
- [ ] `projects.projects`
- [ ] `projects.milestones`
- [ ] `projects.tasks`
- [ ] `source_deal_id` soft FK to `pipeline.deals`
- [ ] RLS policies forced

**APIs**
- [ ] `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id`
- [ ] `GET/POST/PATCH/DELETE /projects/:id/milestones`
- [ ] `GET/POST/PATCH/DELETE /projects/:id/tasks`
- [ ] GraphQL: `Project`, `Milestone`, `Task` types + mutations

**Tests**
- [ ] Unit: auto-project-creation mapping logic (Deal → Project field mapping)
- [ ] Integration: mark deal Won → project auto-created → visible in Projects module
- [ ] E2E: create standalone project, add milestones, switch between Kanban/List/Gantt views without data loss

---

## M6 — Invoicing

**Goal**
- [ ] Manual and auto-generated (from Deal) invoicing, tax rules, partial payments, status state machine, aging view.
- [ ] Deployable as: billing capability layered on the spine — tenant can now actually get paid.

**Files to Create**
- [ ] `services/core-api/src/modules/invoicing/{domain,application,infrastructure,interface,__tests__}/`
- [ ] `apps/web/app/(dashboard)/invoicing/`
- [ ] `db/migrations/0007_invoicing_schema.sql`

**Components**
- [ ] Invoice list + aging view
- [ ] Invoice builder/editor
- [ ] Invoice status badge (state machine visualization)
- [ ] Payment recording form

**Backend**
- [ ] Invoice CRUD use cases
- [ ] `DealWon` subscriber → auto-generate invoice use case
- [ ] Tax rule calculation service
- [ ] Invoice status state machine (draft → sent → partial → paid → overdue → void)
- [ ] Payment recording use case

**Frontend**
- [ ] Invoice list wired with filters (status, date range)
- [ ] Invoice builder wired to deal/project context
- [ ] Aging report view
- [ ] Payment entry form wired to state machine transitions

**Database**
- [ ] `invoicing.invoices`
- [ ] `invoicing.invoice_line_items`
- [ ] `invoicing.payments`
- [ ] `invoicing.tax_rules`
- [ ] `source_deal_id` soft FK to `pipeline.deals`
- [ ] RLS policies forced

**APIs**
- [ ] `GET/POST /invoicing/invoices`, `GET/PATCH /invoicing/invoices/:id`
- [ ] `POST /invoicing/invoices/:id/payments`
- [ ] `GET /invoicing/aging-report`
- [ ] GraphQL: `Invoice`, `Payment` types + mutations

**Tests**
- [ ] Unit: state machine transition rules (illegal transitions rejected), tax calculation
- [ ] Integration: Deal Won → invoice auto-generated → payment recorded → status transitions correctly
- [ ] E2E: manually create an invoice, record a partial payment, confirm aging view reflects it

---

## M7 — Commissions

**Goal**
- [ ] Commission plans, tiered rules, immutable ledger with reversal-only corrections, `needs_review` queue.
- [ ] Deployable as: sales-comp automation, closing out the "money loop" alongside M6.

**Files to Create**
- [ ] `services/core-api/src/modules/commissions/{domain,application,infrastructure,interface,__tests__}/`
- [ ] `apps/web/app/(dashboard)/commissions/`
- [ ] `db/migrations/0008_commissions_schema.sql`

**Components**
- [ ] Commission plan builder
- [ ] Commission ledger view (per rep)
- [ ] `needs_review` queue UI
- [ ] Reversal/correction action flow

**Backend**
- [ ] Commission plan CRUD use cases
- [ ] Tiered-rule calculation engine
- [ ] `PaymentReceived` (or `DealWon`, per plan config) event subscriber → accrual use case
- [ ] Immutable ledger write logic (append-only, reversal-only corrections — no destructive updates)
- [ ] `needs_review` flagging logic for ambiguous accrual scenarios

**Frontend**
- [ ] Plan builder wired to tiered-rule config
- [ ] Ledger view per rep, filterable by period
- [ ] Review queue UI with resolve/escalate actions

**Database**
- [ ] `commissions.plans`
- [ ] `commissions.plan_tiers`
- [ ] `commissions.ledger_entries` (append-only, `REVOKE UPDATE/DELETE` at role level, correction via new reversal row only)
- [ ] `commissions.review_queue`
- [ ] RLS policies forced

**APIs**
- [ ] `GET/POST /commissions/plans`
- [ ] `GET /commissions/ledger` (per rep, per period)
- [ ] `POST /commissions/ledger/:id/reverse`
- [ ] `GET/PATCH /commissions/review-queue`
- [ ] GraphQL: `CommissionPlan`, `LedgerEntry` types + mutations

**Tests**
- [ ] Unit: tiered calculation engine against known scenarios
- [ ] **Immutability test**: confirm ledger rows cannot be updated/deleted at the DB role level, only reversed via new entries
- [ ] Integration: payment received → accrual calculated → ledger entry created → deliberately ambiguous case routes to `needs_review`
- [ ] E2E: full commission accrual → review → resolution flow

---

## M8 — Client Portal

**Goal**
- [ ] External client-facing portal: magic-link/SSO auth, project/milestone visibility, approvals, invoice payment.
- [ ] Deployable as: the first externally-facing (non-team) surface — meaningful launch milestone in its own right.
- [ ] **Completion of M6+M7+M8 = "Money Loop Complete" (Roadmap Milestone M3).**

**Files to Create**
- [ ] `services/core-api/src/modules/client-portal/{domain,application,infrastructure,interface,__tests__}/`
- [ ] `apps/portal/` (separate SPA app, not under `apps/web`)
- [ ] `db/migrations/0009_client_portal_schema.sql`

**Components**
- [ ] Magic-link request/verify screens
- [ ] Portal dashboard (client-visible projects/milestones)
- [ ] Approval action UI
- [ ] Invoice payment flow (payment provider integration point)

**Backend**
- [ ] Magic-link generation/verification service (separate, more restricted session type from internal `iam.sessions`)
- [ ] Optional SSO integration point (stubbed if not launch-blocking)
- [ ] Client-scoped read use cases (only `client_visible = true` project/milestone data)
- [ ] Approval workflow use cases
- [ ] Payment provider integration (e.g., Stripe) for invoice payment

**Frontend**
- [ ] Portal auth flow (magic link)
- [ ] Client dashboard wired to scoped project/invoice data
- [ ] Approval UI wired to backend workflow
- [ ] Payment flow wired to provider + `invoicing.payments` write-back

**Database**
- [ ] `client_portal.portal_users`
- [ ] `client_portal.portal_sessions`
- [ ] `client_portal.approvals`
- [ ] RLS policies forced, plus **additional row-level restriction** to `client_visible = true` records only (stricter than internal RLS)

**APIs**
- [ ] `POST /portal/auth/magic-link`
- [ ] `POST /portal/auth/verify`
- [ ] `GET /portal/projects` (scoped)
- [ ] `POST /portal/approvals/:id/respond`
- [ ] `POST /portal/invoices/:id/pay`
- [ ] GraphQL (or REST-only if portal doesn't need GraphQL — confirm against TDD)

**Tests**
- [ ] Unit: magic-link expiry/single-use enforcement
- [ ] **Security test**: portal user cannot access any project/invoice where `client_visible = false` or belonging to another tenant/client
- [ ] Integration: full magic-link login → view project → approve milestone → pay invoice
- [ ] E2E: payment provider sandbox flow completes and reflects in Invoicing (M6)

---

## M9 — Recruitment *(parallel-track eligible from end of M1 onward)*

**Goal**
- [ ] Full recruitment vertical: candidates, jobs, interview scheduling, Kanban pipeline — largely decoupled from the sales spine.
- [ ] Deployable as: a standalone ATS-style tool; can ship independently of M2–M8 if resourced on a parallel track.

**Files to Create**
- [ ] `services/core-api/src/modules/recruitment/{domain,application,infrastructure,interface,__tests__}/`
- [ ] `apps/web/app/(dashboard)/recruitment/`
- [ ] `db/migrations/0010_recruitment_schema.sql`

**Components**
- [ ] Candidates Kanban (reuses shared Kanban)
- [ ] Job postings list/detail
- [ ] Interview scheduler (depends on M1 Team Management for interviewer = user)
- [ ] Candidate detail drawer

**Backend**
- [ ] Candidate CRUD use cases
- [ ] Job posting CRUD use cases
- [ ] Interview scheduling use cases (interviewer assignment from `iam.users`)
- [ ] Candidate stage-move use cases

**Frontend**
- [ ] Candidates Kanban wired to live data
- [ ] Job postings management UI
- [ ] Interview scheduler wired to team member availability/assignment

**Database**
- [ ] `recruitment.candidates`
- [ ] `recruitment.jobs`
- [ ] `recruitment.interviews`
- [ ] `recruitment.candidate_stages`
- [ ] RLS policies forced
- [ ] `interviewer_id` soft FK to `iam.users`

**APIs**
- [ ] `GET/POST /recruitment/candidates`, `PATCH /recruitment/candidates/:id/stage`
- [ ] `GET/POST /recruitment/jobs`
- [ ] `GET/POST /recruitment/interviews`
- [ ] GraphQL: `Candidate`, `Job`, `Interview` types + mutations

**Tests**
- [ ] Unit: interview scheduling conflict detection
- [ ] Integration: candidate created → moved through stages → interview scheduled with valid team member
- [ ] E2E: full recruitment pipeline flow, Kanban drag-drop parity with Leads/Pipeline (shared component regression check)

---

## M10 — Automation

**Goal**
- [ ] Visual + accessible list-based workflow builder: trigger → condition → action, durable/resumable execution, subscribing to real domain events from M2–M9.
- [ ] Deployable as: cross-module automation layer — meaningfully valuable only once several modules exist, per roadmap sequencing.

**Files to Create**
- [ ] `services/core-api/src/modules/automation/{domain,application,infrastructure,interface,__tests__}/`
- [ ] `apps/web/app/(dashboard)/automation/`
- [ ] `db/migrations/0011_automation_schema.sql`

**Components**
- [ ] Visual workflow builder (drag/connect nodes)
- [ ] Accessible list-based equivalent builder (per UX spec accessibility requirement)
- [ ] Workflow run history/log viewer
- [ ] Trigger/condition/action configuration panels

**Backend**
- [ ] Workflow definition CRUD use cases
- [ ] Trigger registration against `packages/event-contracts` (subscribes to events from CRM, Leads, Pipeline, Projects, Invoicing, etc.)
- [ ] Condition evaluation engine
- [ ] Action execution engine (durable, resumable — via BullMQ per stack decision)
- [ ] Execution history/logging service

**Frontend**
- [ ] Workflow builder wired to backend definition schema
- [ ] Accessible builder variant wired to the same schema (parity, not a stripped-down version)
- [ ] Run history view

**Database**
- [ ] `automation.workflows`
- [ ] `automation.triggers`
- [ ] `automation.conditions`
- [ ] `automation.actions`
- [ ] `automation.executions` (durable state, resumable job tracking)
- [ ] RLS policies forced

**APIs**
- [ ] `GET/POST/PATCH/DELETE /automation/workflows`
- [ ] `POST /automation/workflows/:id/test-run`
- [ ] `GET /automation/executions`
- [ ] GraphQL: `Workflow`, `Execution` types + mutations

**Tests**
- [ ] Unit: condition evaluation engine against known rule sets
- [ ] Integration: real domain event (e.g., `LeadStageChanged` from M3) triggers a configured workflow end-to-end
- [ ] **Durability test**: kill a worker mid-execution, confirm the job resumes correctly rather than duplicating or dropping the action
- [ ] E2E: build a workflow via visual builder AND the accessible builder, confirm both produce identical execution behavior

---

## M11 — Analytics

**Goal**
- [ ] Per-module dashboards + custom dashboard builder, backed by CQRS read models fed from the event bus across all modules built so far.
- [ ] Deployable as: reporting layer — genuinely useful once M2–M9 have real data flowing.

**Files to Create**
- [ ] `services/core-api/src/modules/analytics/{domain,application,infrastructure,interface,__tests__}/`
- [ ] `apps/web/app/(dashboard)/analytics/`
- [ ] `db/migrations/0012_analytics_read_models.sql`

**Components**
- [ ] Pre-built per-module dashboard views
- [ ] Custom dashboard builder (widget/chart selection)
- [ ] Data table fallback view (per UX spec — every chart has a table equivalent)

**Backend**
- [ ] Read-model projection service (materialized views over Postgres, per stack decision, deferring ClickHouse)
- [ ] Event bus subscribers building/updating projections per module event
- [ ] Custom dashboard config CRUD use cases
- [ ] Query service for dashboard widgets

**Frontend**
- [ ] Pre-built dashboards wired to read-model endpoints
- [ ] Custom builder wired to config CRUD + query service
- [ ] Table-view fallback toggle on every chart

**Database**
- [ ] `analytics.dashboard_configs`
- [ ] Materialized views per module (e.g., `analytics.mv_pipeline_summary`, `analytics.mv_invoicing_summary`, etc.)
- [ ] Refresh strategy (scheduled or event-triggered materialized view refresh)
- [ ] RLS policies forced on all analytics tables/views

**APIs**
- [ ] `GET /analytics/dashboards/:module` (pre-built)
- [ ] `GET/POST/PATCH/DELETE /analytics/custom-dashboards`
- [ ] `GET /analytics/widgets/:id/data`
- [ ] GraphQL: `Dashboard`, `Widget` types + queries

**Tests**
- [ ] Unit: query service aggregation logic
- [ ] Integration: event fired in a source module → projection updates → dashboard reflects new data within expected latency
- [ ] Accessibility test: every chart's table-view fallback renders equivalent data
- [ ] E2E: build a custom dashboard, add widgets from 2+ modules, confirm correct cross-module aggregation

---

## M12 — AI Assistant

**Goal**
- [ ] Non-modal AI panel that can call into any module's application-layer use cases as tools, with confirm-before-execute and a distinct audit actor type.
- [ ] Deployable as: the differentiating capability layer — requires all prior modules' command/query surfaces to be stable, per roadmap sequencing.

**Files to Create**
- [ ] `services/core-api/src/platform/ai-orchestration/{domain,application,infrastructure,interface,__tests__}/`
- [ ] `services/core-api/src/modules/ai-assistant/` (if distinct from orchestration layer per architecture doc)
- [ ] `apps/web/app/(dashboard)/_components/ai-panel/`
- [ ] `db/migrations/0013_ai_schema.sql`

**Components**
- [ ] Non-modal AI panel (persistent, dockable per UX spec)
- [ ] Confirm-before-execute action card
- [ ] Tool-call transparency view (what the AI is about to do, scoped to user's permissions)
- [ ] Conversation history view

**Backend**
- [ ] Tool registry (maps AI-callable actions to existing module use cases — no new business logic, only orchestration)
- [ ] Permission-scoped tool execution (AI cannot exceed the calling user's own RBAC/ABAC permissions)
- [ ] Confirm-before-execute gating logic
- [ ] Distinct `ai_agent` audit actor type wired into `audit.audit_events`
- [ ] LLM API integration layer

**Frontend**
- [ ] AI panel UI wired to orchestration backend
- [ ] Confirmation UI for proposed actions
- [ ] Audit trail visibility for AI-taken actions (transparency requirement)

**Database**
- [ ] `ai.conversations`
- [ ] `ai.messages`
- [ ] `ai.tool_calls` (records every attempted/executed tool call, links to `audit.audit_events`)
- [ ] RLS policies forced

**APIs**
- [ ] `POST /ai/conversations`
- [ ] `POST /ai/conversations/:id/messages`
- [ ] `POST /ai/tool-calls/:id/confirm`
- [ ] `GET /ai/tool-calls` (audit view)
- [ ] GraphQL or WebSocket/streaming endpoint for real-time responses (per TDD)

**Tests**
- [ ] Unit: tool registry permission-scoping logic
- [ ] **Security test**: AI cannot execute any tool call outside the invoking user's actual RBAC/ABAC grants, under adversarial prompts
- [ ] Integration: cross-module action (e.g., create Deal + schedule follow-up Task) executed via AI, confirmed via audit trail
- [ ] E2E: user requests an action, sees confirm-before-execute card, approves, action reflected in the relevant module (e.g., Pipeline)

---

## M13 — Enterprise & Scale Hardening

**Goal**
- [ ] Dedicated-schema/dedicated-instance tenancy tiers, SSO/SAML, MFA, white-label partner tier, DR-tested, load-tested, pen-tested.
- [ ] Deployable as: the enterprise-sales-ready release — not a new module, but a hardening pass across everything built in M0–M12.

**Files to Create**
- [ ] `infra/terraform/dedicated-tenancy/`
- [ ] `services/core-api/src/platform/tenancy/dedicated-schema/`, `.../dedicated-instance/`
- [ ] `services/core-api/src/platform/iam-core/sso/`
- [ ] `apps/web/app/(dashboard)/settings/white-label/`
- [ ] `docs/runbooks/dr-drill.md`
- [ ] `docs/runbooks/incident-response.md`

**Components**
- [ ] SSO/SAML configuration screen (tenant admin)
- [ ] MFA enrollment/enforcement UI
- [ ] White-label branding configuration (Partner tier)
- [ ] Tenancy-tier upgrade flow (shared → dedicated schema → dedicated instance)

**Backend**
- [ ] Dedicated-schema provisioning automation
- [ ] Dedicated-instance provisioning automation
- [ ] SSO/SAML integration (per enterprise IdP requirements)
- [ ] MFA enforcement-by-tenant-policy logic
- [ ] White-label/Partner → Partner's Clients multi-level tenancy logic

**Frontend**
- [ ] SSO config UI wired to backend
- [ ] MFA enrollment flow
- [ ] White-label branding UI (logo, colors, domain) wired to theming system from M0

**Database**
- [ ] Dedicated-schema migration tooling (per-tenant schema cloning)
- [ ] `platform.tenancy_tiers`
- [ ] `iam.sso_configs`
- [ ] `iam.mfa_enrollments`
- [ ] `platform.partner_hierarchies` (for white-label multi-level tenancy)

**APIs**
- [ ] `POST /admin/tenants/:id/upgrade-tier`
- [ ] `POST/GET /settings/sso`
- [ ] `POST /settings/mfa/enroll`
- [ ] `POST/GET /settings/white-label`
- [ ] GraphQL: relevant admin/settings types + mutations

**Tests**
- [ ] Integration: tenant tier upgrade (shared → dedicated schema) with zero data loss
- [ ] **DR drill test**: restore a single tenant from backup without affecting any other tenant
- [ ] **Load test**: simulated multi-tenant "noisy neighbor" scenario, confirm isolation holds under load
- [ ] **Penetration test**: full external pen test pass, findings triaged and closed
- [ ] SOC 2 Type II readiness checklist verification
- [ ] E2E: full white-label partner flow — partner branding applied, partner's client tenant correctly scoped underneath

---

## Cross-Milestone Notes

- [ ] Every milestone's "Tests" section must include an RLS/tenant-isolation check for any new tenant-scoped table — this isn't optional per-module, it's a standing requirement from M0 onward.
- [ ] Every milestone that introduces a Kanban view must run the shared-component regression suite (built in M3, reused in M4/M5/M9) rather than writing a new Kanban implementation.
- [ ] Every milestone that emits or consumes a domain event must have a corresponding entry validated against `packages/event-contracts` — no ad hoc event payloads.
- [ ] "Independently deployable" means: the milestone can go to production behind existing auth (M0) without requiring any milestone *after* it to exist. It does not mean zero dependency on milestones *before* it — the dependency graph in the roadmap still applies.
