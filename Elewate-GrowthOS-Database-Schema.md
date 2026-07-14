# Elewate GrowthOS — PostgreSQL Database Schema Design

**Prepared as a Senior PostgreSQL Database Architect brief**
**Scope:** Full logical schema design, table-by-table, pre-SQL
**Target:** Multi-tenant, millions-of-rows scale, RLS-native, audit-complete

---

## Part A — Global Conventions (apply to every table unless noted)

Rather than repeat these nine conventions in every one of the ~50 tables below, they're defined once here. Every table description assumes them by default; any table that deviates says so explicitly.

### A.1 Standard Column Set

Every table (except a few append-only/system tables noted individually) includes:

| Column | Type | Purpose |
|---|---|---|
| `id` | `UUID` (default `gen_random_uuid()`) | Primary key. UUIDs chosen over serials so IDs are generatable client-side/offline, non-guessable (security), and safely mergeable across future shards without collision. |
| `tenant_id` | `UUID`, `NOT NULL` | Tenant scoping — present on every tenant-owned table. Foreign key to `platform.tenants(id)`. This is the column RLS policies filter on. |
| `created_at` | `TIMESTAMPTZ`, `NOT NULL DEFAULT now()` | Audit field. |
| `updated_at` | `TIMESTAMPTZ`, `NOT NULL DEFAULT now()` | Audit field, maintained via trigger on every UPDATE. |
| `created_by` | `UUID`, nullable | FK to `iam.users(id)`. Nullable to permit system/automation-created records (`created_by IS NULL` + a companion `created_by_system` text field for e.g. `'automation_engine'`, `'ai_assistant'`, `'import'`). |
| `updated_by` | `UUID`, nullable | Same pattern as `created_by`. |
| `deleted_at` | `TIMESTAMPTZ`, nullable | Soft-delete marker. `NULL` = active record. Never physically `DELETE` tenant business data — always set this instead. |
| `deleted_by` | `UUID`, nullable | Who performed the soft delete. |
| `version` | `INTEGER`, `NOT NULL DEFAULT 1` | Optimistic concurrency control — incremented on every update; write operations check expected version to detect and reject stale concurrent edits (surfaces as the "merge conflict" UX described in the design spec). |

**Naming conventions:**
- Tables: `snake_case`, plural (`contacts`, `deals`, `line_items`).
- Schema-qualified: `crm.contacts`, `pipeline.deals` — every business module owns its own Postgres schema (matches the architecture doc's logical schema boundaries).
- Foreign key columns: `<referenced_singular>_id` (e.g., `contact_id`, `owner_id` where "owner" is a role-like alias for a user reference).
- Boolean columns: prefixed `is_`/`has_` (`is_primary`, `has_attachments`).
- Enum-like status columns: implemented as Postgres `ENUM` types where the value set is small, stable, and internal (e.g., invoice status); implemented as a lookup table + FK where tenants need to customize/extend values (e.g., pipeline stages, lead sources) — this distinction is called out per table.

### A.2 Soft Delete Pattern

- No table-level `DELETE` for tenant business data. Application layer always issues `UPDATE ... SET deleted_at = now(), deleted_by = :user_id`.
- **Every non-unique index that matters for active-record queries is a partial index** filtered `WHERE deleted_at IS NULL` — this keeps indexes small and fast even as soft-deleted rows accumulate over years (a critical performance detail at millions-of-rows scale; without this, indexes bloat with dead-to-the-business but not-actually-deleted rows).
- Unique constraints that should only apply to *active* records (e.g., "email unique per tenant among active contacts") are implemented as **partial unique indexes** (`WHERE deleted_at IS NULL`), not table-level `UNIQUE` constraints — otherwise a soft-deleted record would block re-creating a record with the same natural key.
- A scheduled job may eventually hard-delete records past a compliance retention window (GDPR erasure requests, data retention policy expiry) — this is a deliberate, audited, separate process from everyday soft delete.

### A.3 Row-Level Security (RLS) Pattern

Every tenant-scoped table has RLS **enabled and forced** (`ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`, the latter so even the table owner role is subject to policy — critical, since ORM connections often run as the owning role).

Standard policy shape applied per table (described here once, not repeated per table below):
- A session-level setting `app.current_tenant_id` is set by the connection-pooling middleware immediately after a connection is checked out, scoped to the current request.
- Policy: `USING (tenant_id = current_setting('app.current_tenant_id')::uuid)` for `SELECT`/`UPDATE`/`DELETE`, and a matching `WITH CHECK` for `INSERT`/`UPDATE` to prevent cross-tenant writes.
- Platform-tier super-admin access (support/ops tooling) uses a **separate, explicitly audited bypass role** rather than disabling RLS — bypass is logged as a distinct audit event type per the platform's audit design.
- Schema-per-tenant and dedicated-instance tenants (per the tiered multi-tenancy model) don't strictly need RLS since isolation is physical — but RLS is still applied uniformly across all tiers for defense-in-depth and so application code doesn't need tier-aware branching logic.

### A.4 Indexing Baseline

- Every table gets a **composite index leading with `tenant_id`** for any column combination used in common filtered/sorted queries — `tenant_id` first is essential since RLS injects a `tenant_id =` filter into effectively every query the planner sees.
- Foreign key columns are indexed by default (Postgres does not auto-index FKs, unlike primary keys) — every FK listed below has a corresponding index unless explicitly noted as covered by a composite index instead.
- All "active record" indexes are partial (`WHERE deleted_at IS NULL`), per A.2.
- Full-text search columns use `GIN` indexes over `tsvector` generated columns, not `LIKE '%term%'` scans.

### A.5 Constraints Baseline

- `NOT NULL` enforced aggressively at the database layer, not just application validation — the database is the last line of defense for data integrity.
- `CHECK` constraints for value ranges/enums where cheap to enforce (e.g., `probability BETWEEN 0 AND 100`).
- Cross-schema foreign keys are **intentionally omitted** at the database constraint level in several cases (documented per-table) to preserve module independence per the architecture's "soft foreign key" decision — referential integrity across module boundaries is enforced at the application/event layer instead, since a hard DB-level FK across schemas would block the future extraction of a module into its own service/database.

---

## Part B — Schema: `platform` (Platform-of-Platforms — Not Tenant-Scoped)

### B.1 `platform.tenants`

**Purpose:** The root record of the entire system — one row per customer workspace (including white-label partners and their sub-tenants).

**Columns:**
- `id UUID PK`
- `name TEXT NOT NULL`
- `slug TEXT NOT NULL` — used in subdomain routing (`slug.growthos.app`)
- `tier TEXT NOT NULL` — `'shared' | 'dedicated_schema' | 'dedicated_instance'` (drives the tiered isolation model)
- `parent_tenant_id UUID NULL` — self-referencing FK, supports the Partner → Partner's Clients hierarchy for white-label
- `custom_domain TEXT NULL`
- `branding_config JSONB NOT NULL DEFAULT '{}'` — logo URL, color palette, terminology overrides
- `status TEXT NOT NULL DEFAULT 'active'` — `'trial' | 'active' | 'suspended' | 'cancelled'`
- `region TEXT NOT NULL DEFAULT 'us-east-1'` — for data-residency-pinned dedicated instances
- Standard audit fields (this table has no `tenant_id` column itself — it *is* the tenant root, so this is the one table exempted from A.1's `tenant_id` requirement)

**Relationships:** Self-referencing (`parent_tenant_id → id`) for partner hierarchy. Referenced by virtually every other table's `tenant_id`.

**Indexes:** Unique index on `slug`; unique partial index on `custom_domain WHERE custom_domain IS NOT NULL`; index on `parent_tenant_id`; index on `status` (platform ops frequently filters active vs. suspended).

**Constraints:** `CHECK (tier IN ('shared','dedicated_schema','dedicated_instance'))`; `CHECK (status IN ('trial','active','suspended','cancelled'))`; `slug` constrained to URL-safe charset via `CHECK` regex.

### B.2 `platform.subscriptions`

**Purpose:** Tracks each tenant's billing plan with the platform itself (distinct from the tenant's own `billing` schema, which is *their* invoicing of *their* clients).

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK → platform.tenants`, `plan_code TEXT NOT NULL`, `seats_licensed INTEGER NOT NULL`, `status TEXT NOT NULL`, `current_period_start/end TIMESTAMPTZ`, `billing_provider_ref TEXT` (external Stripe/etc. subscription ID), standard audit fields.

**Relationships:** Belongs to one `tenant`. One tenant typically has one active subscription (enforced at app layer; historical/cancelled rows retained for billing history).

**Indexes:** Index on `tenant_id`; index on `billing_provider_ref` for webhook reconciliation lookups.

**Constraints:** `FK tenant_id → platform.tenants(id)`; `CHECK (status IN ('trialing','active','past_due','cancelled'))`.

### B.3 `platform.feature_flags`

**Purpose:** Per-tenant feature entitlement (which modules/capabilities are enabled — supports plan-gating and gradual rollout).

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `flag_key TEXT NOT NULL`, `enabled BOOLEAN NOT NULL DEFAULT false`, `config JSONB NOT NULL DEFAULT '{}'` (flag-specific settings, e.g., AI usage cap), standard audit fields.

**Indexes:** Unique composite index on `(tenant_id, flag_key)` (partial `WHERE deleted_at IS NULL`).

**Constraints:** `FK tenant_id`; unique `(tenant_id, flag_key)`.

---

## Part C — Schema: `iam` (Identity & Access)

### C.1 `iam.users`

**Purpose:** A person who can log in — shared identity record; a single human may belong to multiple tenants (e.g., a consultant working across client workspaces), so identity itself is tenant-agnostic while **membership** (below) is tenant-scoped.

**Columns:** `id UUID PK`, `email CITEXT NOT NULL` (case-insensitive), `password_hash TEXT NULL` (null if SSO-only), `full_name TEXT NOT NULL`, `avatar_file_id UUID NULL FK → files.file_metadata`, `mfa_enabled BOOLEAN NOT NULL DEFAULT false`, `last_login_at TIMESTAMPTZ NULL`, `status TEXT NOT NULL DEFAULT 'active'`, standard audit fields **except this table has no `tenant_id`** (identity is global; access is scoped via `iam.tenant_memberships` below).

**Relationships:** Referenced by nearly every other table's `created_by`/`owner_id`-style columns platform-wide. One-to-many with `tenant_memberships`.

**Indexes:** Unique index on `email`; index on `status`.

**Constraints:** `CHECK (status IN ('active','invited','disabled'))`; email format `CHECK` via regex or domain-level validation preferred at app layer.

### C.2 `iam.tenant_memberships`

**Purpose:** The join between a global `user` and a `tenant`, carrying tenant-specific role assignment — this is the actual "who can do what in this workspace" record, and **is** tenant-scoped.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `user_id UUID NOT NULL FK → iam.users`, `status TEXT NOT NULL DEFAULT 'active'` (`'invited'|'active'|'suspended'`), `invited_at TIMESTAMPTZ`, `joined_at TIMESTAMPTZ NULL`, standard audit fields.

**Relationships:** Many-to-many bridge between `users` and `tenants`; one-to-many with `user_roles` (below) for the actual role grants within this membership.

**Indexes:** Unique composite `(tenant_id, user_id)` partial `WHERE deleted_at IS NULL`; index on `user_id` alone (to answer "what tenants does this user belong to" without a tenant filter — one of the few cross-tenant queries that's legitimate, used at login to render the workspace switcher).

**Constraints:** `FK tenant_id`, `FK user_id`; unique `(tenant_id, user_id)`.

### C.3 `iam.roles`

**Purpose:** Tenant-customizable role definitions (seeded from system templates, editable per tenant per the delegated-administration requirement).

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `name TEXT NOT NULL`, `is_system_default BOOLEAN NOT NULL DEFAULT false` (system-seeded roles like "Tenant Owner" that can't be deleted), `description TEXT`, standard audit fields.

**Indexes:** Composite `(tenant_id, name)` unique partial; index on `tenant_id`.

**Constraints:** Unique `(tenant_id, name)` among active rows; `is_system_default` rows protected from deletion at application layer.

### C.4 `iam.permissions`

**Purpose:** The global, platform-defined catalog of permission strings (`module.resource.action.scope`) — **not tenant-scoped**, since the permission catalog itself is defined by the platform, only role-to-permission *assignment* is tenant-customizable.

**Columns:** `id UUID PK`, `key TEXT NOT NULL` (e.g., `pipeline.deal.read.own`), `module TEXT NOT NULL`, `description TEXT`, standard audit fields minus `tenant_id`.

**Indexes:** Unique index on `key`; index on `module` (used to render permission-matrix UI grouped by module).

### C.5 `iam.role_permissions`

**Purpose:** Join table granting specific permissions to a tenant's role.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `role_id UUID NOT NULL FK → iam.roles`, `permission_id UUID NOT NULL FK → iam.permissions`, `scope_override JSONB NULL` (attribute-rule overrides, e.g., restricting to a specific territory), standard audit fields.

**Indexes:** Unique composite `(tenant_id, role_id, permission_id)` partial; index on `role_id`; index on `permission_id`.

**Constraints:** Composite FK integrity ensures `role_id`'s tenant matches `tenant_id` — enforced via application layer or a `CHECK`-plus-trigger since Postgres can't natively FK-constrain "role belongs to the same tenant" without a trigger.

### C.6 `iam.user_roles`

**Purpose:** Assigns one or more roles to a user's tenant membership.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `membership_id UUID NOT NULL FK → iam.tenant_memberships`, `role_id UUID NOT NULL FK → iam.roles`, standard audit fields.

**Indexes:** Unique composite `(membership_id, role_id)` partial; index on `role_id`.

### C.7 `iam.sessions`

**Purpose:** Active/historical login sessions, backing refresh-token rotation and instant revocation.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `user_id UUID NOT NULL FK`, `refresh_token_hash TEXT NOT NULL`, `token_family_id UUID NOT NULL` (rotation-family for reuse detection), `ip_address INET`, `user_agent TEXT`, `expires_at TIMESTAMPTZ NOT NULL`, `revoked_at TIMESTAMPTZ NULL`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` (no `updated_at`/soft-delete — sessions are naturally expiring, not soft-deleted business objects).

**Indexes:** Index on `user_id`; index on `token_family_id`; partial index `WHERE revoked_at IS NULL AND expires_at > now()` for the "active sessions" hot path.

**Constraints:** `FK user_id`, `FK tenant_id`.

### C.8 `iam.api_keys`

**Purpose:** Scoped API keys for programmatic/partner access.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `name TEXT NOT NULL`, `key_hash TEXT NOT NULL`, `key_prefix TEXT NOT NULL` (displayed in UI, e.g., `gos_live_ab12`), `scopes TEXT[] NOT NULL`, `last_used_at TIMESTAMPTZ NULL`, `expires_at TIMESTAMPTZ NULL`, standard audit fields.

**Indexes:** Unique index on `key_hash`; index on `tenant_id`; index on `key_prefix`.

---

## Part D — Schema: `crm`

### D.1 `crm.companies`

**Purpose:** Organizations the tenant does business with.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `name TEXT NOT NULL`, `domain TEXT NULL`, `industry TEXT NULL`, `size_range TEXT NULL`, `owner_id UUID NULL FK → iam.tenant_memberships`, `tags TEXT[] NOT NULL DEFAULT '{}'`, `search_vector TSVECTOR` (generated column over name/domain), standard audit fields.

**Relationships:** One-to-many with `crm.contacts`; referenced (soft FK) by `pipeline.deals`.

**Indexes:** Composite `(tenant_id, name)` for sorted listing; GIN index on `search_vector`; GIN index on `tags`; index on `owner_id`.

**Constraints:** `FK tenant_id`; `FK owner_id → iam.tenant_memberships`.

### D.2 `crm.contacts`

**Purpose:** Individual people — the most-referenced entity in the whole system.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `company_id UUID NULL FK → crm.companies`, `first_name TEXT NOT NULL`, `last_name TEXT NOT NULL`, `email CITEXT NULL`, `phone TEXT NULL`, `owner_id UUID NULL FK → iam.tenant_memberships`, `tags TEXT[] NOT NULL DEFAULT '{}'`, `custom_fields JSONB NOT NULL DEFAULT '{}'` (tenant-defined extra fields without schema migration), `search_vector TSVECTOR`, standard audit fields.

**Relationships:** Many-to-one with `crm.companies`; soft-referenced by `pipeline.deals.contact_id`, `leads.leads.converted_contact_id`, `portal.portal_users.contact_id`.

**Indexes:** Composite `(tenant_id, company_id)`; partial unique `(tenant_id, email) WHERE deleted_at IS NULL AND email IS NOT NULL` (prevents duplicate active contacts by email per tenant); GIN on `search_vector`; GIN on `tags`; index on `owner_id`.

**Constraints:** `FK tenant_id`, `FK company_id`, `FK owner_id`; `CHECK (first_name <> '' )`.

### D.3 `crm.activities`

**Purpose:** Unified activity/interaction timeline (calls, emails, notes, meetings) — shared by Contacts, Companies, and referenced from Deals for the activity-timeline UX.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `subject_type TEXT NOT NULL` (`'contact'|'company'|'deal'` — polymorphic association), `subject_id UUID NOT NULL`, `activity_type TEXT NOT NULL` (`'call'|'email'|'note'|'meeting'`), `body TEXT NULL`, `occurred_at TIMESTAMPTZ NOT NULL`, `performed_by UUID NULL FK → iam.tenant_memberships`, standard audit fields.

**Relationships:** Polymorphic — no hard DB FK on `subject_id` (can't FK to multiple possible parent tables cleanly in Postgres without a trigger-based check); integrity enforced at application layer.

**Indexes:** Composite `(tenant_id, subject_type, subject_id, occurred_at DESC)` — this is the primary access pattern (load a subject's timeline, newest first) and the single most important index in this table.

**Constraints:** `CHECK (subject_type IN ('contact','company','deal'))`; `CHECK (activity_type IN ('call','email','note','meeting'))`.

---

## Part E — Schema: `leads`

### E.1 `leads.leads`

**Purpose:** Inbound/sourced leads prior to qualification/conversion.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `source_id UUID NULL FK → leads.lead_sources`, `first_name TEXT`, `last_name TEXT`, `email CITEXT`, `phone TEXT`, `company_name TEXT` (freeform, pre-linked to a real `crm.companies` row), `status TEXT NOT NULL DEFAULT 'new'`, `score INTEGER NOT NULL DEFAULT 0`, `score_breakdown JSONB NOT NULL DEFAULT '{}'` (explainability data for the score UX), `owner_id UUID NULL FK → iam.tenant_memberships`, `disqualify_reason TEXT NULL`, `converted_contact_id UUID NULL` (soft FK to `crm.contacts` — set upon conversion), `converted_deal_id UUID NULL` (soft FK to `pipeline.deals`), `converted_at TIMESTAMPTZ NULL`, standard audit fields.

**Relationships:** Many-to-one with `lead_sources`; soft-referenced conversion targets in `crm`/`pipeline` schemas (intentionally not hard FK'd — cross-schema, and conversion is a point-in-time event, not an ongoing referential relationship the DB needs to enforce).

**Indexes:** Composite `(tenant_id, status)` partial `WHERE deleted_at IS NULL` (backs the Kanban board's primary "leads by status" query); composite `(tenant_id, score DESC)` for scored-priority sorting; index on `owner_id`; index on `source_id`.

**Constraints:** `CHECK (status IN ('new','contacted','qualified','disqualified','converted'))`; `CHECK (score BETWEEN 0 AND 100)`.

### E.2 `leads.lead_sources`

**Purpose:** Tenant-configurable source catalog (Website Form, Referral, Cold Outreach, Import, etc.).

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `name TEXT NOT NULL`, `channel_type TEXT NOT NULL`, `is_active BOOLEAN NOT NULL DEFAULT true`, standard audit fields.

**Indexes:** Unique composite `(tenant_id, name)` partial.

### E.3 `leads.scoring_rules`

**Purpose:** Tenant-defined weighted rules feeding the score calculation.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `name TEXT NOT NULL`, `condition JSONB NOT NULL` (structured rule expression, evaluated by the scoring engine), `weight INTEGER NOT NULL`, `is_active BOOLEAN NOT NULL DEFAULT true`, standard audit fields.

**Indexes:** Composite `(tenant_id, is_active)`.

---

## Part F — Schema: `pipeline`

### F.1 `pipeline.deals`

**Purpose:** The core revenue object — an opportunity moving through sales stages.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `name TEXT NOT NULL`, `contact_id UUID NULL` (soft FK → `crm.contacts`), `company_id UUID NULL` (soft FK → `crm.companies`), `stage_id UUID NOT NULL FK → pipeline.pipeline_stages`, `value_amount NUMERIC(14,2) NOT NULL DEFAULT 0`, `value_currency CHAR(3) NOT NULL DEFAULT 'USD'`, `probability SMALLINT NOT NULL DEFAULT 0`, `expected_close_date DATE NULL`, `owner_id UUID NULL FK → iam.tenant_memberships`, `status TEXT NOT NULL DEFAULT 'open'` (`'open'|'won'|'lost'`), `lost_reason TEXT NULL`, `won_at TIMESTAMPTZ NULL`, `lost_at TIMESTAMPTZ NULL`, standard audit fields.

**Note on why `contact_id`/`company_id` are soft (no hard FK) here but hard FK to `pipeline_stages`:** cross-schema references (crm ↔ pipeline) stay soft per the architecture's module-independence rule; `stage_id` is a hard FK because it's an intra-schema reference within `pipeline` itself, where enforcing referential integrity costs nothing in terms of module coupling.

**Relationships:** Many-to-one with `pipeline_stages` (hard FK); soft-referenced to `crm.contacts`/`crm.companies`; one-to-many with `pipeline.quotes`; referenced (soft FK) by `billing.invoices.deal_id` and `commissions.payouts` upon Won.

**Indexes:** Composite `(tenant_id, stage_id)` partial (backs the Kanban board query — "all deals in this stage"); composite `(tenant_id, owner_id, status)` for "My Deals"; composite `(tenant_id, expected_close_date)` partial for the forecast view; index on `contact_id`; index on `company_id`.

**Constraints:** `FK stage_id`, `FK owner_id`, `FK tenant_id`; `CHECK (probability BETWEEN 0 AND 100)`; `CHECK (status IN ('open','won','lost'))`; `CHECK (value_amount >= 0)`.

### F.2 `pipeline.pipeline_stages`

**Purpose:** Tenant-configurable stage definitions (ordered, with default probability weights).

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `name TEXT NOT NULL`, `display_order SMALLINT NOT NULL`, `default_probability SMALLINT NOT NULL`, `requires_close_date BOOLEAN NOT NULL DEFAULT false` (drives the "this stage requires a close date" validation from the UX spec), standard audit fields.

**Indexes:** Unique composite `(tenant_id, display_order)` partial.

**Constraints:** `CHECK (default_probability BETWEEN 0 AND 100)`.

### F.3 `pipeline.quotes`

**Purpose:** Line-itemized quotes attached to a deal, the precursor to an invoice.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `deal_id UUID NOT NULL FK → pipeline.deals`, `status TEXT NOT NULL DEFAULT 'draft'`, `total_amount NUMERIC(14,2) NOT NULL DEFAULT 0`, `currency CHAR(3) NOT NULL DEFAULT 'USD'`, `valid_until DATE NULL`, standard audit fields.

**Relationships:** Many-to-one with `deals` (hard FK, intra-schema); one-to-many with `quote_line_items`.

**Indexes:** Index on `deal_id`; composite `(tenant_id, status)`.

### F.4 `pipeline.quote_line_items`

**Purpose:** Individual line items within a quote.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `quote_id UUID NOT NULL FK → pipeline.quotes`, `description TEXT NOT NULL`, `quantity NUMERIC(10,2) NOT NULL DEFAULT 1`, `unit_price NUMERIC(14,2) NOT NULL`, `line_total NUMERIC(14,2) NOT NULL` (denormalized/computed via trigger to avoid recalculating on every read), `display_order SMALLINT NOT NULL`, standard audit fields.

**Indexes:** Composite `(tenant_id, quote_id, display_order)`.

**Constraints:** `FK quote_id`; `CHECK (quantity > 0)`; `CHECK (unit_price >= 0)`.

---

## Part G — Schema: `projects`

### G.1 `projects.projects`

**Purpose:** A unit of delivery work, often originated from a Won deal.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `name TEXT NOT NULL`, `source_deal_id UUID NULL` (soft FK → `pipeline.deals`), `status TEXT NOT NULL DEFAULT 'active'`, `health TEXT NOT NULL DEFAULT 'on_track'` (`'on_track'|'at_risk'|'off_track'` — drives the health-flag widget), `start_date DATE NULL`, `target_end_date DATE NULL`, `owner_id UUID NULL FK → iam.tenant_memberships`, `client_visible BOOLEAN NOT NULL DEFAULT false` (gates Client Portal sync), standard audit fields.

**Relationships:** One-to-many with `tasks`, `milestones`; soft-referenced from `pipeline.deals`; referenced by `portal.shared_assets` and `portal.approvals` when `client_visible = true`.

**Indexes:** Composite `(tenant_id, status)` partial; composite `(tenant_id, health)` partial for the "at risk" widget; index on `owner_id`.

**Constraints:** `CHECK (status IN ('active','on_hold','completed','archived'))`; `CHECK (health IN ('on_track','at_risk','off_track'))`.

### G.2 `projects.milestones`

**Purpose:** Key delivery checkpoints, often client-visible.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `project_id UUID NOT NULL FK → projects.projects`, `name TEXT NOT NULL`, `due_date DATE NULL`, `status TEXT NOT NULL DEFAULT 'pending'`, `client_visible BOOLEAN NOT NULL DEFAULT false`, `display_order SMALLINT NOT NULL`, standard audit fields.

**Indexes:** Composite `(tenant_id, project_id, display_order)`.

### G.3 `projects.tasks`

**Purpose:** Actionable work items — the highest-write-volume table in this schema.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `project_id UUID NOT NULL FK → projects.projects`, `milestone_id UUID NULL FK → projects.milestones`, `title TEXT NOT NULL`, `description TEXT NULL`, `status TEXT NOT NULL DEFAULT 'todo'`, `assignee_id UUID NULL FK → iam.tenant_memberships`, `due_date DATE NULL`, `priority TEXT NOT NULL DEFAULT 'medium'`, `display_order NUMERIC(20,10) NOT NULL` (fractional-indexing float, not integer, so drag-drop reordering never requires renumbering siblings — critical at high write volume), standard audit fields.

**Relationships:** Many-to-one with `projects` and optionally `milestones`.

**Indexes:** Composite `(tenant_id, project_id, status, display_order)` — backs the primary board-column query; composite `(tenant_id, assignee_id, status)` partial for "My Tasks"; composite `(tenant_id, due_date)` partial for due-soon widgets.

**Constraints:** `CHECK (status IN ('todo','in_progress','in_review','done'))`; `CHECK (priority IN ('low','medium','high','urgent'))`.

### G.4 `projects.timesheets`

**Purpose:** Time logged against tasks/projects (billing and utilization input).

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `task_id UUID NULL FK → projects.tasks`, `project_id UUID NOT NULL FK → projects.projects`, `user_id UUID NOT NULL FK → iam.tenant_memberships`, `minutes_logged INTEGER NOT NULL`, `logged_date DATE NOT NULL`, `notes TEXT NULL`, `billable BOOLEAN NOT NULL DEFAULT true`, standard audit fields.

**Indexes:** Composite `(tenant_id, project_id, logged_date)`; composite `(tenant_id, user_id, logged_date)` for personal timesheet views.

**Constraints:** `CHECK (minutes_logged > 0)`.

---

## Part H — Schema: `recruitment`

### H.1 `recruitment.job_requisitions`

**Purpose:** An open role being hired for.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `title TEXT NOT NULL`, `department TEXT NULL`, `status TEXT NOT NULL DEFAULT 'open'`, `hiring_manager_id UUID NULL FK → iam.tenant_memberships`, `opened_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `closed_at TIMESTAMPTZ NULL`, standard audit fields.

**Indexes:** Composite `(tenant_id, status)` partial.

**Constraints:** `CHECK (status IN ('draft','open','on_hold','closed','filled'))`.

### H.2 `recruitment.candidates`

**Purpose:** A person under consideration for one or more requisitions (a candidate can apply to multiple roles, hence the separate pipeline-position table below).

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `first_name TEXT NOT NULL`, `last_name TEXT NOT NULL`, `email CITEXT NULL`, `phone TEXT NULL`, `resume_file_id UUID NULL FK → files.file_metadata`, `source TEXT NULL`, `search_vector TSVECTOR`, standard audit fields.

**Indexes:** Partial unique `(tenant_id, email) WHERE deleted_at IS NULL AND email IS NOT NULL`; GIN on `search_vector`.

### H.3 `recruitment.candidate_pipeline_positions`

**Purpose:** The many-to-many junction representing a candidate's status within a specific requisition's pipeline — this is what actually renders as a Kanban card.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `requisition_id UUID NOT NULL FK → recruitment.job_requisitions`, `candidate_id UUID NOT NULL FK → recruitment.candidates`, `stage TEXT NOT NULL DEFAULT 'applied'`, `rejected_reason TEXT NULL`, standard audit fields.

**Indexes:** Unique composite `(requisition_id, candidate_id)` partial; composite `(tenant_id, requisition_id, stage)` — the Kanban board query.

**Constraints:** `CHECK (stage IN ('applied','screening','interview','offer','hired','rejected'))`.

### H.4 `recruitment.interviews`

**Purpose:** Scheduled interview events tied to a pipeline position.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `pipeline_position_id UUID NOT NULL FK → recruitment.candidate_pipeline_positions`, `scheduled_at TIMESTAMPTZ NOT NULL`, `duration_minutes INTEGER NOT NULL DEFAULT 30`, `interviewer_id UUID NULL FK → iam.tenant_memberships`, `feedback TEXT NULL`, `outcome TEXT NULL`, standard audit fields.

**Indexes:** Composite `(tenant_id, interviewer_id, scheduled_at)` — backs "My Interviews This Week."

**Constraints:** `CHECK (outcome IN ('pending','advance','reject') OR outcome IS NULL)`.

---

## Part I — Schema: `portal`

### I.1 `portal.portal_users`

**Purpose:** External client-side login identities, distinct from internal `iam.users` (different auth flow — magic link primarily — and a much narrower permission surface, so kept as a separate table rather than overloading `iam.users` with a role flag).

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `contact_id UUID NULL` (soft FK → `crm.contacts` — links the portal login to the underlying CRM person), `email CITEXT NOT NULL`, `status TEXT NOT NULL DEFAULT 'active'`, `last_login_at TIMESTAMPTZ NULL`, standard audit fields.

**Indexes:** Partial unique `(tenant_id, email) WHERE deleted_at IS NULL`.

### I.2 `portal.approvals`

**Purpose:** Client-facing approval requests (deliverables, quotes) requiring an external yes/no decision.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `subject_type TEXT NOT NULL` (polymorphic, e.g., `'milestone'|'quote'|'file'`), `subject_id UUID NOT NULL`, `requested_by UUID NULL FK → iam.tenant_memberships`, `portal_user_id UUID NULL FK → portal.portal_users`, `status TEXT NOT NULL DEFAULT 'pending'`, `decided_at TIMESTAMPTZ NULL`, `decision_notes TEXT NULL`, standard audit fields.

**Indexes:** Composite `(tenant_id, portal_user_id, status)` — backs the client's "pending approvals" widget.

**Constraints:** `CHECK (status IN ('pending','approved','changes_requested'))`.

---

## Part J — Schema: `billing` (Tenant's Own Invoicing of Their Clients)

### J.1 `billing.invoices`

**Purpose:** Financial documents billed to a tenant's client.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `invoice_number TEXT NOT NULL` (tenant-scoped sequential, human-facing), `deal_id UUID NULL` (soft FK → `pipeline.deals`), `contact_id UUID NULL` (soft FK → `crm.contacts`), `status TEXT NOT NULL DEFAULT 'draft'`, `subtotal NUMERIC(14,2) NOT NULL DEFAULT 0`, `tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0`, `total_amount NUMERIC(14,2) NOT NULL DEFAULT 0`, `currency CHAR(3) NOT NULL DEFAULT 'USD'`, `due_date DATE NULL`, `sent_at TIMESTAMPTZ NULL`, `paid_at TIMESTAMPTZ NULL`, standard audit fields.

**Relationships:** One-to-many with `invoice_line_items`, `payments`.

**Indexes:** Unique composite `(tenant_id, invoice_number)` partial; composite `(tenant_id, status)` partial — backs the status-tab filter; composite `(tenant_id, due_date)` partial `WHERE status NOT IN ('paid','void')` — backs the overdue-aging widget specifically (a targeted partial index for the single most performance-sensitive query in this table).

**Constraints:** `CHECK (status IN ('draft','sent','partially_paid','paid','overdue','void'))`; `CHECK (total_amount >= 0)`.

### J.2 `billing.invoice_line_items`

**Purpose:** Line items on an invoice.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `invoice_id UUID NOT NULL FK → billing.invoices`, `description TEXT NOT NULL`, `quantity NUMERIC(10,2) NOT NULL DEFAULT 1`, `unit_price NUMERIC(14,2) NOT NULL`, `tax_rate_id UUID NULL FK → billing.tax_rates`, `line_total NUMERIC(14,2) NOT NULL`, `display_order SMALLINT NOT NULL`, standard audit fields.

**Indexes:** Composite `(tenant_id, invoice_id, display_order)`.

### J.3 `billing.payments`

**Purpose:** Payment records against invoices (supports partial payments).

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `invoice_id UUID NOT NULL FK → billing.invoices`, `amount NUMERIC(14,2) NOT NULL`, `method TEXT NOT NULL`, `provider_reference TEXT NULL`, `received_at TIMESTAMPTZ NOT NULL DEFAULT now()`, standard audit fields (this table typically has **no soft delete** — financial ledger entries are immutable once recorded; corrections happen via a compensating reversal entry, not by editing/deleting history — noted as an explicit deviation from A.2).

**Indexes:** Index on `invoice_id`; composite `(tenant_id, received_at)`.

**Constraints:** `CHECK (amount > 0)`; `FK invoice_id`.

### J.4 `billing.tax_rates`

**Purpose:** Tenant-configurable tax rules.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `name TEXT NOT NULL`, `rate_percent NUMERIC(5,2) NOT NULL`, `region TEXT NULL`, `is_active BOOLEAN NOT NULL DEFAULT true`, standard audit fields.

---

## Part K — Schema: `commissions`

### K.1 `commissions.commission_plans`

**Purpose:** Defines how commissions are calculated.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `name TEXT NOT NULL`, `calculation_rules JSONB NOT NULL` (structured rule tree — tiered rates, thresholds), `is_active BOOLEAN NOT NULL DEFAULT true`, standard audit fields.

### K.2 `commissions.plan_assignments`

**Purpose:** Assigns a plan to specific users.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `plan_id UUID NOT NULL FK → commissions.commission_plans`, `user_id UUID NOT NULL FK → iam.tenant_memberships`, `effective_from DATE NOT NULL`, `effective_to DATE NULL`, standard audit fields.

**Indexes:** Composite `(tenant_id, user_id, effective_from)`.

### K.3 `commissions.ledger_entries`

**Purpose:** Append-only accrual/payout record — the single source of truth for all commission money movement, deliberately modeled as an immutable ledger (accounting best practice: never mutate a financial fact, only append offsetting/correcting entries).

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `user_id UUID NOT NULL FK → iam.tenant_memberships`, `source_type TEXT NOT NULL` (`'deal_won'|'invoice_paid'|'manual_adjustment'|'reversal'`), `source_id UUID NULL` (soft FK to the originating deal/invoice), `plan_id UUID NULL FK → commissions.commission_plans`, `amount NUMERIC(14,2) NOT NULL`, `status TEXT NOT NULL DEFAULT 'accrued'`, `payout_run_id UUID NULL FK → commissions.payout_runs`, `needs_review BOOLEAN NOT NULL DEFAULT false` (flags calculation-rule conflicts per the UX spec's error-state design), `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` (append-only — **no `updated_at`, no soft delete**, corrections happen via a `'reversal'`-type offsetting entry referencing the original via `source_id`, an explicit deviation from A.1/A.2 justified by financial-ledger integrity requirements).

**Indexes:** Composite `(tenant_id, user_id, status)` — backs "My Commissions"; composite `(tenant_id, payout_run_id)`; partial index `WHERE needs_review = true` for the admin review queue.

**Constraints:** `CHECK (status IN ('accrued','pending_payout','paid','reversed'))`.

### K.4 `commissions.payout_runs`

**Purpose:** Batch payout processing records.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `run_date DATE NOT NULL`, `status TEXT NOT NULL DEFAULT 'draft'`, `total_amount NUMERIC(14,2) NOT NULL DEFAULT 0`, `approved_by UUID NULL FK → iam.tenant_memberships`, `approved_at TIMESTAMPTZ NULL`, standard audit fields.

**Constraints:** `CHECK (status IN ('draft','pending_approval','approved','paid'))`.

---

## Part L — Schema: `automation`

### L.1 `automation.workflows`

**Purpose:** A configured automation definition.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `name TEXT NOT NULL`, `trigger_type TEXT NOT NULL`, `trigger_config JSONB NOT NULL`, `definition JSONB NOT NULL` (the full condition/action step tree), `status TEXT NOT NULL DEFAULT 'draft'`, `definition_version INTEGER NOT NULL DEFAULT 1` (independent from the row-level optimistic-concurrency `version` in A.1 — this tracks *workflow logic* versions so in-flight executions can reference the version they started on, per the architecture doc), standard audit fields.

**Indexes:** Composite `(tenant_id, status)` partial; index on `trigger_type` (the execution engine subscribes by trigger type across all tenants, so this index — combined with `tenant_id` — matters for the engine's dispatch query).

**Constraints:** `CHECK (status IN ('draft','active','paused'))`.

### L.2 `automation.execution_logs`

**Purpose:** Durable, replayable record of every workflow run — high write volume, append-mostly.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `workflow_id UUID NOT NULL FK → automation.workflows`, `workflow_definition_version INTEGER NOT NULL`, `trigger_payload JSONB NOT NULL`, `status TEXT NOT NULL DEFAULT 'running'`, `step_results JSONB NOT NULL DEFAULT '[]'` (per-step outcome, powering the "Step 3 failed" UX detail), `failed_step_index SMALLINT NULL`, `started_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `completed_at TIMESTAMPTZ NULL` (no soft delete — execution history is retained per audit/debugging needs and pruned by a separate retention job, not user-facing soft delete).

**Indexes:** Composite `(tenant_id, workflow_id, started_at DESC)`; partial index `WHERE status = 'failed'` for the "needs attention" widget.

**Constraints:** `CHECK (status IN ('running','completed','failed'))`; `FK workflow_id`.

---

## Part M — Schema: `ai`

### M.1 `ai.assistant_sessions`

**Purpose:** A conversation thread with the AI Assistant.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `user_id UUID NOT NULL FK → iam.tenant_memberships`, `title TEXT NULL` (auto-generated summary for session history list), `context JSONB NOT NULL DEFAULT '{}'` (what screen/entity the session started from), standard audit fields.

**Indexes:** Composite `(tenant_id, user_id, updated_at DESC)` — backs "Recent conversations."

### M.2 `ai.tool_calls`

**Purpose:** Every action the assistant took or proposed — the AI-specific audit trail feeding into the platform's broader audit system.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `session_id UUID NOT NULL FK → ai.assistant_sessions`, `tool_name TEXT NOT NULL`, `input_payload JSONB NOT NULL`, `output_payload JSONB NULL`, `status TEXT NOT NULL DEFAULT 'proposed'`, `confirmed_by UUID NULL FK → iam.tenant_memberships`, `executed_at TIMESTAMPTZ NULL`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` (append-only, no soft delete — an audit-adjacent record).

**Indexes:** Composite `(tenant_id, session_id, created_at)`.

**Constraints:** `CHECK (status IN ('proposed','confirmed','executed','rejected','failed'))`.

### M.3 `ai.embeddings`

**Purpose:** Vector index backing RAG retrieval, strictly tenant-scoped at the storage level (not just filtered post-query — per the architecture's requirement to enforce isolation structurally).

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `source_type TEXT NOT NULL`, `source_id UUID NOT NULL`, `content_hash TEXT NOT NULL` (avoids re-embedding unchanged content), `embedding VECTOR(1536)` (via `pgvector` extension), `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Indexes:** `IVFFLAT` or `HNSW` index (pgvector) on `embedding`, **partitioned/filtered by `tenant_id`** conceptually via the surrounding `WHERE tenant_id = ...` on every query, combined with a plain B-tree composite `(tenant_id, source_type, source_id)` for exact-match lookups/invalidation on source update.

**Constraints:** Unique composite `(tenant_id, source_type, source_id)` (one current embedding per source record; re-embeds overwrite rather than accumulate).

---

## Part N — Schema: `analytics`

### N.1 `analytics.metric_snapshots`

**Purpose:** Pre-aggregated, time-bucketed metrics feeding dashboard widgets — a denormalized read-model table populated by event-bus consumers, deliberately not queried live against OLTP tables.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `metric_key TEXT NOT NULL` (e.g., `'pipeline_value_by_stage'`), `bucket_date DATE NOT NULL`, `dimensions JSONB NOT NULL DEFAULT '{}'` (grouping dimensions, e.g., `{"stage_id": "..."}`), `value NUMERIC(18,4) NOT NULL`, `computed_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Indexes:** Composite `(tenant_id, metric_key, bucket_date)` — this table is written in batch and read in narrow time-range scans, so this is the only index needed; no soft delete (recomputed/replaced by upsert on `(tenant_id, metric_key, bucket_date, dimensions)`).

**Note:** This table is a strong candidate for native Postgres **declarative partitioning by `bucket_date` range** (monthly partitions) once volume grows — flagged here as a forward-looking scalability note rather than a day-one requirement.

### N.2 `analytics.dashboard_configs`

**Purpose:** User/tenant-defined custom dashboard layouts.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `owner_id UUID NULL FK → iam.tenant_memberships` (`NULL` = tenant-wide shared dashboard), `name TEXT NOT NULL`, `layout JSONB NOT NULL` (widget positions/configs), standard audit fields.

**Indexes:** Composite `(tenant_id, owner_id)`.

---

## Part O — Schema: `notifications`

### O.1 `notifications.notification_templates`

**Purpose:** Tenant-brandable message templates per event type/channel.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `event_key TEXT NOT NULL`, `channel TEXT NOT NULL`, `subject_template TEXT NULL`, `body_template TEXT NOT NULL`, standard audit fields.

**Indexes:** Unique composite `(tenant_id, event_key, channel)` partial.

### O.2 `notifications.delivery_logs`

**Purpose:** Record of every notification sent, for debugging and compliance (e.g., proving an invoice reminder was actually sent).

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `recipient_user_id UUID NULL`, `recipient_portal_user_id UUID NULL`, `channel TEXT NOT NULL`, `event_key TEXT NOT NULL`, `status TEXT NOT NULL DEFAULT 'queued'`, `provider_reference TEXT NULL`, `sent_at TIMESTAMPTZ NULL`, `failed_reason TEXT NULL`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` (append-only, no soft delete).

**Indexes:** Composite `(tenant_id, recipient_user_id, created_at DESC)`; partial `WHERE status = 'failed'`.

**Constraints:** `CHECK (status IN ('queued','sent','delivered','failed','bounced'))`; `CHECK ((recipient_user_id IS NOT NULL) OR (recipient_portal_user_id IS NOT NULL))` — exactly one recipient type populated.

### O.3 `notifications.preferences`

**Purpose:** Per-user channel/frequency preferences.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `user_id UUID NOT NULL FK → iam.tenant_memberships`, `event_key TEXT NOT NULL`, `channel TEXT NOT NULL`, `enabled BOOLEAN NOT NULL DEFAULT true`, standard audit fields.

**Indexes:** Unique composite `(tenant_id, user_id, event_key, channel)` partial.

---

## Part P — Schema: `audit` (Immutable, Append-Only)

### P.1 `audit.audit_events`

**Purpose:** The system-wide, tamper-evident audit trail — the single most legally/security-critical table in the schema. Explicitly **not** subject to A.1/A.2 conventions: no `updated_at` (never updated), no soft delete (never deleted by application code at all), no `version` column (immutable by definition).

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL`, `actor_type TEXT NOT NULL` (`'user'|'ai_assistant'|'automation'|'system'|'platform_support'`), `actor_id UUID NULL`, `action TEXT NOT NULL` (e.g., `'invoice.updated'`, `'role.permission_changed'`, `'session.impersonation_started'`), `subject_type TEXT NOT NULL`, `subject_id UUID NOT NULL`, `before_state JSONB NULL`, `after_state JSONB NULL`, `ip_address INET NULL`, `correlation_id UUID NULL`, `hash_chain_prev TEXT NULL`, `hash_chain_current TEXT NOT NULL` (tamper-evidence: each row's hash includes the previous row's hash, so retroactive edits become detectable), `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Indexes:** Composite `(tenant_id, subject_type, subject_id, created_at DESC)` — backs the tenant admin's per-record audit view; composite `(tenant_id, actor_id, created_at DESC)`; composite `(tenant_id, action, created_at DESC)`.

**Constraints:** No `UPDATE`/`DELETE` grants at the database role level for the application's normal runtime role — enforced via `REVOKE UPDATE, DELETE` at the role-permission layer, not just application discipline, since this table's integrity guarantee must hold even against a compromised or buggy application layer.

**Note on scale:** This table grows fastest and longest-retained of any in the system (1–7 year compliance retention). Strongly recommended for **native declarative partitioning by `created_at` (monthly range partitions)** from day one, not deferred — unlike `metric_snapshots` where partitioning was flagged as a future concern, here it's a launch-day requirement given the guaranteed high volume and long retention.

---

## Part Q — Schema: `files`

### Q.1 `files.file_metadata`

**Purpose:** System of record for uploaded files; actual bytes live in object storage, this table holds pointers, ownership, and access metadata.

**Columns:** `id UUID PK`, `tenant_id UUID NOT NULL FK`, `subject_type TEXT NULL` (polymorphic association to the owning entity, nullable for standalone uploads), `subject_id UUID NULL`, `storage_key TEXT NOT NULL` (the `/tenants/{tenant_id}/...` object path), `original_filename TEXT NOT NULL`, `mime_type TEXT NOT NULL`, `size_bytes BIGINT NOT NULL`, `version SMALLINT NOT NULL DEFAULT 1` (note: this overloads the A.1 `version` column's usual optimistic-concurrency meaning — here it also serves as the document-version number for the versioning feature described in the UX spec; both meanings coincide naturally since a new version *is* a new edit), `scan_status TEXT NOT NULL DEFAULT 'pending'` (`'pending'|'clean'|'infected'`), `client_visible BOOLEAN NOT NULL DEFAULT false`, standard audit fields.

**Indexes:** Composite `(tenant_id, subject_type, subject_id)`; partial `WHERE scan_status = 'pending'` (backs the async-scan worker's polling query).

**Constraints:** `CHECK (scan_status IN ('pending','clean','infected','error'))`; application layer must block `client_visible = true` while `scan_status != 'clean'`.

---

## Part R — Cross-Cutting Notes on Millions-of-Rows Performance

1. **`tasks`, `execution_logs`, `audit_events`, `activities`, and `tool_calls`** are the five tables most likely to reach tens-of-millions of rows within 2–3 years of meaningful tenant volume — each has been given a leading-column composite index matched precisely to its dominant query shape rather than a generic `tenant_id`-only index, since a generic index alone would still require a secondary sort/filter pass at scale.
2. **Partitioning strategy:** `audit_events` partitioned by `created_at` from launch; `metric_snapshots` and `execution_logs` are strong candidates once single-tenant partitions exceed ~10M rows — deferred rather than premature, since partitioning adds operational complexity (partition maintenance, constraint exclusion tuning) that isn't worth paying for before it's needed.
3. **Large tenant "noisy neighbor" isolation:** because `tenant_id` leads every composite index, a single very large tenant's rows cluster together on the index but don't degrade query performance for other tenants sharing the table — the planner can use the index prefix to jump straight to that tenant's slice.
4. **JSONB usage is deliberately scoped**: used for genuinely variable/tenant-defined structure (`custom_fields`, `definition`, `branding_config`) — never used as a substitute for a proper column+index when the field is queried/filtered/sorted on frequently (e.g., `status`, `stage_id`, `due_date` are always real typed columns, never buried in JSON, specifically so they remain indexable with standard B-tree indexes).
5. **Connection-level tenant context (`app.current_tenant_id`)** is set via `SET LOCAL` scoped to the transaction, not the connection, to remain safe under connection pooling (PgBouncer transaction-mode) where a physical connection is reused across different tenants' requests in rapid succession — an easy-to-miss correctness bug in naive RLS implementations.

---

*This document defines logical schema structure and rationale ahead of DDL. Next step: generate the full `CREATE TABLE` / `CREATE POLICY` / `CREATE INDEX` SQL per schema, followed by a migration-ordering plan (schemas with no cross-dependencies first: `platform`, `iam`, `files` → then `crm` → then dependent schemas), and a seed-data script for default roles, permissions, and pipeline stages.*
