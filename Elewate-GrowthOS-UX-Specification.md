# Elewate GrowthOS — UX & Product Design Specification

**Prepared as a Head of Design brief — Linear/Notion-caliber craft standard**
**Scope:** Global design system + full UX spec for all 12 modules
**Status:** Pre-visual-design — this document defines behavior, structure, and states before a single pixel is drawn

---

## Part A — Global Design Foundations

Before module-by-module specs, every module inherits these shared systems. Repeating them per-module would be noise; deviations are called out explicitly where they occur.

### A.1 Design Principles

1. **Speed is a feature.** Every interaction target: perceived response < 100ms (optimistic UI), full data < 1s. If something can't be instant, it must *feel* instant (skeletons, optimistic writes, streaming).
2. **Density with breathing room.** Linear's information density, Notion's whitespace discipline. Never sparse-for-the-sake-of-premium; never cramped-for-the-sake-of-data.
3. **One primary action per screen.** Every screen has a single obvious "next thing to do" — everything else is secondary, tucked into overflow menus or contextual hover states.
4. **Keyboard-first, mouse-friendly.** Command palette (`Cmd+K`) as a first-class citizen across the entire product, not a gimmick — every module's primary actions are reachable without touching the mouse.
5. **Progressive disclosure.** Lists show scannable summaries; detail views reveal depth on demand. Never force users through a full form when a quick-add will do.
6. **Consistent object model visualized consistently.** A "Contact" looks and behaves the same (avatar, name, company chip, tag color) whether seen in CRM, Pipeline, or Client Portal — this is what makes the product feel coherent across 12 modules instead of like 12 bolted-together tools.

### A.2 Global Navigation Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Top Bar: [Workspace Switcher] [Global Search/Cmd+K]      │
│          [AI Assistant Trigger] [Notifications] [Avatar] │
├───────────┬───────────────────────────────────────────────┤
│           │                                                │
│  Sidebar  │              Main Content Area                 │
│  (collap- │        (Screen Hierarchy per module,            │
│  sible)   │         detailed below)                         │
│           │                                                │
│           │                                                │
├───────────┴───────────────────────────────────────────────┤
│  (Mobile only) Bottom Tab Bar                              │
└─────────────────────────────────────────────────────────┘
```

**Sidebar structure (shared shell, populated per workspace config):**
```
[Workspace Name / Logo — white-label themed]
─────────────────────────
🏠 Home (unified dashboard)
🔍 Search
✨ AI Assistant
─────────────────────────
📇 CRM
🎯 Leads
📈 Pipeline
📁 Projects
👥 Recruitment
🌐 Client Portal
🧾 Invoicing
💰 Commissions
📊 Analytics
⚡ Automation
🧑‍🤝‍🧑 Team
─────────────────────────
⚙️ Settings
[Collapse toggle]
```

- Sidebar is **user-reorderable and hideable per module** (respecting RBAC — modules a role can't access never render, not just disabled).
- Collapsed state shows icon-only rail (Linear-style), expandable via hover-peek or pin.
- Active module highlighted with a subtle left-border accent in the tenant's brand color (white-label theming point).
- Each module section can expand in the sidebar to show **saved views/pinned filters** (e.g., under Pipeline: "My Deals," "Closing This Month") — this is where power users live.

### A.3 Command Palette (Cmd+K) — Global

- Fuzzy search across all entities (contacts, deals, tasks, invoices) the user has permission to see, tenant-scoped.
- Action commands ("Create deal," "Invite teammate," "Run automation") alongside navigation.
- AI-aware: typing a natural-language query ("show me deals closing this week") routes to the AI Assistant inline rather than failing to match.

### A.4 Shared Component Behaviors (apply everywhere unless noted)

**Loading states (global pattern):**
- Skeleton screens matching final layout shape (never spinners for primary content) — list rows render as shimmering placeholder rows, detail panels as placeholder blocks.
- Data that's already cached renders instantly (stale-while-revalidate) with a subtle top-of-screen progress bar (Linear-style) indicating a background refresh, never a full-screen blocking spinner after first load.

**Empty states (global pattern):**
- Every empty state has: a short, human sentence (not a generic "No data"), one primary CTA, and — where relevant — a link to sample/template data or a relevant help doc. Never just an icon and dead air.

**Error states (global pattern):**
- Inline, field-level errors for forms (never toast-only for validation).
- Toast/banner for transient failures (network, save conflict) with a **Retry** action.
- Full-page error state only for catastrophic failures (module fails to load) — includes a "Report issue" link that pre-fills diagnostic context.
- Optimistic UI failures roll back visibly with a brief inline explanation ("Couldn't move this deal — reverted"), never a silent revert.

**Mobile global behavior:**
- Bottom tab bar replaces sidebar: Home, Search, AI, Notifications, More (overflow drawer for less-frequent modules).
- Desktop's multi-column layouts collapse to single-column with a stack navigation pattern (list → detail push, back gesture/button).
- Swipe gestures for common actions (swipe-to-complete a task, swipe-to-archive a lead) mirroring iOS/Android platform conventions.
- Forms are single-column, large touch targets (min 44x44pt), sticky save/submit bar at the bottom of the viewport.

**Accessibility (global baseline — WCAG 2.1 AA target):**
- Full keyboard navigability (tab order logical, focus states always visible, no keyboard traps in modals).
- Color is never the sole indicator of state (status always paired with icon/text label, not just a colored dot).
- Minimum 4.5:1 contrast for body text, 3:1 for large text/UI components, verified against every white-label theme (contrast-checked programmatically when a tenant customizes brand colors, with a warning if a custom palette fails).
- Screen-reader labels on all icon-only buttons; live regions announce async state changes (e.g., "Deal moved to Won" announced when a drag-drop pipeline action completes).
- Respect `prefers-reduced-motion` — animations degrade to instant/fade rather than motion-heavy transitions.
- Text resizing up to 200% without loss of content or function (no fixed-height text containers that clip).

---

## Part B — Module-by-Module UX Specifications

---

### B.1 CRM (Contacts & Companies)

**User Journey:**
A user lands on CRM to find/manage relationships. Journey: Land on Contacts list → filter/search → open a contact profile → view relationship timeline (activities, deals, invoices linked) → edit or take an action (log a call, create a deal, send email) → return to list or navigate to a related record (their company, an open deal).

**Screen Hierarchy:**
```
CRM
├── Contacts List (default view)
│   └── Contact Detail (drawer or full page)
│       ├── Overview tab (fields, tags, owner)
│       ├── Activity Timeline tab
│       ├── Related Deals tab
│       ├── Related Projects tab
│       └── Files tab
├── Companies List
│   └── Company Detail
│       ├── Overview tab
│       ├── Contacts (people at this company)
│       ├── Deals tab
│       └── Activity tab
└── Import/Merge tool (secondary flow)
```

**Navigation:** Tab switcher at top of module (Contacts / Companies). List views default to table (dense, sortable columns); a card-view toggle available for visual/relationship-heavy browsing. Clicking a row opens a **right-side drawer** by default (keeps list context visible) with an "expand to full page" affordance for deep work.

**Sidebar structure (module-local, appears when CRM is active):**
```
CRM
 ├─ All Contacts
 ├─ All Companies
 ├─ My Contacts
 ├─ Recently Viewed
 ├─ Saved Segments (user-created, e.g. "VIP Clients")
 └─ Import Contacts
```

**Dashboard widgets (surfaced on Home + CRM landing):**
- "Contacts needing follow-up" (no activity in N days, per tenant-configurable threshold)
- New contacts this week (sparkline)
- Top companies by open deal value
- Recently viewed contacts (personal, not shared)

**Empty state:** First-run: "No contacts yet — import your list or add your first contact." Primary CTA: **Import CSV**; secondary: **Add manually**. Includes a link to a sample CSV template.

**Loading state:** Table renders skeleton rows (avatar circle + 4 text-line placeholders) matching real row layout; column headers render immediately since they're static.

**Error state:** Failed contact save → inline error under the offending field (e.g., "Email already exists for another contact") with a **View duplicate** link (ties into merge tool). Failed list load → full-panel error with Retry.

**Mobile behavior:** Contacts list is a single scrollable list with swipe actions (swipe right: call/email quick action; swipe left: archive). Contact detail is a full-screen push view with tabs converted to a horizontal scroll chip selector.

**Accessibility:** Table rows are keyboard-navigable (arrow keys move focus, Enter opens detail); drawer traps focus correctly and returns focus to the triggering row on close; avatar images have alt text of contact name, not filename.

---

### B.2 Lead Management

**User Journey:**
Lead enters (via form, import, or manual entry) → auto-scored → appears in "New Leads" queue → rep reviews, qualifies or disqualifies → qualified lead converts into a Contact + Deal (bridges into Pipeline module) → disqualified leads archived with reason logged for later analysis.

**Screen Hierarchy:**
```
Leads
├── Inbox View (Kanban by status: New → Contacted → Qualified → Disqualified)
├── List View (table, alternate to Kanban)
├── Lead Detail (drawer)
│   ├── Score breakdown (why this score, contributing factors)
│   ├── Source & UTM info
│   ├── Activity/contact log
│   └── Convert action (→ Contact + Deal)
├── Lead Sources config (admin)
└── Scoring Rules config (admin)
```

**Navigation:** Kanban is the default landing view (visual triage is the primary daily workflow); toggle to List for bulk operations (bulk assign, bulk disqualify).

**Sidebar structure:**
```
Leads
 ├─ Inbox (Kanban)
 ├─ All Leads (list)
 ├─ My Leads
 ├─ Disqualified
 ├─ Sources
 └─ Scoring Rules
```

**Dashboard widgets:**
- New leads today/this week (count + trend)
- Conversion rate funnel (New → Qualified → Converted)
- Leads by source (donut/bar)
- Leads aging (sitting >48h untouched) — flagged in an accent color, this is the "urgent attention" widget

**Empty state:** "No leads yet — connect a form, import a list, or add one manually." Shows three equally-weighted CTAs since all three onboarding paths are common.

**Loading state:** Kanban columns render with skeleton cards (3 placeholder cards per column) so the board shape is recognizable instantly.

**Error state:** Scoring engine failure on a specific lead shows a small warning badge on the card ("Score unavailable") rather than blocking the card from rendering — never let a background-process failure hide primary data.

**Mobile behavior:** Kanban degrades to a **segmented list** (status as a filter chip row at top, one column's leads shown at a time) since drag-drop Kanban is poor on small touchscreens; card tap opens detail; a "Move to..." action sheet replaces drag-drop for status changes.

**Accessibility:** Kanban has a list-view equivalent specifically so screen-reader/keyboard users aren't forced through drag-drop interaction (drag-drop is *never* the only way to change lead status — every drag action has an equivalent menu-driven action).

---

### B.3 Sales Pipeline

**User Journey:**
Rep opens Pipeline → sees deals as cards across stage columns (Kanban, primary metaphor) → drags a deal to next stage as conversations progress → opens a deal for full context (contact, notes, tasks, quote, files) → logs activity or updates fields → deal eventually marked Won (triggers Invoicing) or Lost (reason captured for analytics).

**Screen Hierarchy:**
```
Pipeline
├── Board View (Kanban by stage) — default
├── List/Table View
├── Forecast View (weighted value by stage/period)
├── Deal Detail (full page, not drawer — deals are the richest object)
│   ├── Summary header (value, stage, close date, owner)
│   ├── Activity tab
│   ├── Quote/Line items tab
│   ├── Files tab
│   ├── Related Contact/Company panel (side rail)
│   └── Tasks tab
└── Pipeline Settings (stages, probability weights) — admin
```

**Navigation:** Board / List / Forecast as a top-level segmented control. Deal Detail opens as a **full page** (not a drawer, unlike Contacts) because deals accumulate enough content (quotes, files, multi-tab activity) that a drawer would feel cramped — this is a deliberate deviation from the CRM pattern, justified by information density.

**Sidebar structure:**
```
Pipeline
 ├─ Board
 ├─ My Deals
 ├─ Closing This Month
 ├─ Forecast
 ├─ Lost Deals
 └─ Pipeline Settings
```

**Dashboard widgets:**
- Pipeline value by stage (funnel chart)
- Weighted forecast this quarter
- Deals closing this week (list widget)
- Win rate trend (sparkline)
- Deals with no activity in 7+ days (risk flag widget)

**Empty state:** "Your pipeline is empty — create your first deal or import from a spreadsheet." Shows an illustrative sample-board ghost image so a brand-new tenant understands what a populated board looks like before they've added data.

**Loading state:** Board columns skeleton-load with card-shaped placeholders; the Forecast view shows a skeleton bar chart shape rather than blank space.

**Error state:** Drag-drop stage change failure (e.g., a required field missing to enter that stage) shows a **non-destructive revert** with an inline modal: "This stage requires a Close Date — add one to proceed," keeping the user's intent alive rather than just silently failing.

**Mobile behavior:** Board view becomes a **single-column stage list** you swipe between (one stage full-width at a time, swipe left/right to move between stages, similar to Leads). Deal Detail is a full-screen stacked view with sticky header (value + stage) always visible while scrolling tabs below.

**Accessibility:** Every drag-drop stage change has a keyboard/menu equivalent ("Move to stage..." dropdown on each card, reachable via keyboard focus + Enter). Forecast charts include a data-table alternate view toggle for screen-reader users (charts alone are not accessible).

---

### B.4 Projects

**User Journey:**
PM creates a project (often from a Won deal) → defines milestones/tasks → assigns team members → team works from their personal task list or the project board → PM monitors progress via project dashboard → client-visible milestones sync to Client Portal.

**Screen Hierarchy:**
```
Projects
├── Projects List (grid of project cards, grouped by status)
├── Project Detail
│   ├── Overview (progress, health, key dates)
│   ├── Board/Task view (Kanban or List toggle)
│   ├── Timeline/Gantt view
│   ├── Files tab
│   ├── Team tab (assigned members, roles)
│   └── Client-visible settings (what syncs to Portal)
├── My Tasks (personal cross-project view)
└── Sprints (if enabled — agile mode)
```

**Navigation:** Projects List is grid-of-cards (visual status at a glance: health color, progress bar, due date). Within a project, a persistent left-local-nav switches between Overview/Board/Timeline/Files/Team without losing project context (breadcrumb always shows Project Name at top).

**Sidebar structure:**
```
Projects
 ├─ All Projects
 ├─ My Tasks
 ├─ Active
 ├─ At Risk
 ├─ Completed
 └─ Templates
```

**Dashboard widgets:**
- Projects at risk (red/amber health flags)
- My tasks due today/this week
- Team workload (tasks per person, spot overload)
- Recently completed milestones

**Empty state:** "No projects yet — start from a template or create a blank project." Templates are prominently offered here since most agencies run repeatable project types.

**Loading state:** Project cards skeleton with a placeholder progress bar and health-dot; Gantt/Timeline view shows skeleton bars of varying width to suggest the eventual chart shape.

**Error state:** Task update conflict (two people editing same task) surfaces a **merge prompt**: "This task was updated by [Name] moments ago — Keep mine / Use theirs / Merge," rather than silently overwriting — critical for team-collaboration trust.

**Mobile behavior:** Task board becomes a filterable list (status as a top filter chip bar), matching the pattern used in Leads/Pipeline for consistency. Timeline/Gantt view is **hidden on mobile** behind a "Best viewed on desktop" notice with a link to the task-list equivalent — Gantt charts are acknowledged as a desktop-only power tool rather than forced into an unusable tiny mobile rendering.

**Accessibility:** Task checkboxes are large, clearly labeled, and independently focusable; Gantt/Timeline view offers a linked "View as list" toggle as the accessible alternative.

---

### B.5 Recruitment

**User Journey:**
Recruiter creates a Job Requisition → candidates apply or are sourced/imported → candidates flow through pipeline stages (Applied → Screening → Interview → Offer → Hired) → interview scheduling coordinates with calendar → hired candidate can optionally provision as a Team Management user.

**Screen Hierarchy:**
```
Recruitment
├── Job Requisitions List
│   └── Requisition Detail
│       ├── Candidate Pipeline (Kanban by stage)
│       ├── Job posting details/settings
│       └── Requisition analytics (time-to-fill, source breakdown)
├── Candidate Detail (drawer, opened from pipeline)
│   ├── Resume/profile
│   ├── Interview feedback tab
│   ├── Notes/activity
│   └── Offer details
└── Interview Scheduling flow (modal/side panel)
```

**Navigation:** Requisitions list is the entry point (most recruiters manage multiple open roles) → drilling into a requisition reveals its own Kanban pipeline, scoped to that role — this nesting mirrors Pipeline module's Kanban pattern intentionally, for muscle-memory consistency across the product.

**Sidebar structure:**
```
Recruitment
 ├─ Open Requisitions
 ├─ All Candidates
 ├─ My Interviews (today/this week)
 ├─ Offers Pending
 └─ Closed Requisitions
```

**Dashboard widgets:**
- Open requisitions count + aging
- Interviews scheduled this week
- Time-to-fill trend
- Candidates by stage (funnel)

**Empty state:** "No open roles — create your first job requisition." CTA offers a role-template picker (common titles pre-filled) to reduce first-use friction.

**Loading state:** Requisition cards skeleton-load with placeholder title/count bars; candidate Kanban mirrors the Pipeline module's skeleton pattern for consistency.

**Error state:** Interview scheduling conflict (calendar overlap detected) shows an inline warning within the scheduling panel *before* submission — proactive conflict detection rather than a failed save after the fact.

**Mobile behavior:** Candidate pipeline follows the same single-column-swipe pattern as Leads/Pipeline (consistency across all Kanban-based modules is a deliberate system-wide rule, not per-module reinvention). Interview scheduling on mobile opens the device's native calendar-picker component where possible for familiarity.

**Accessibility:** Candidate stage-change has full keyboard/menu equivalent, per system-wide Kanban rule. Resume file previews include a text-extraction fallback for screen readers when the source is a scanned/image-based PDF.

---

### B.6 Client Portal

**User Journey:**
External client logs in (magic link or SSO) → sees a simplified, branded dashboard scoped only to their own projects/invoices/approvals → reviews shared files or project milestones → approves/rejects a deliverable or a quote → messages their account rep → views/pays an invoice.

**Screen Hierarchy:**
```
Client Portal (external-facing, distinct branded shell)
├── Portal Home (their projects at a glance)
├── Project View (client-safe subset of internal Project detail)
│   ├── Milestones/progress
│   ├── Shared files
│   └── Approvals (pending/completed)
├── Invoices (view/pay)
├── Messages (thread with account team)
└── Account/Profile settings (minimal — name, password, notification prefs)
```

**Navigation:** Deliberately minimal — a simple top nav (Home / Projects / Invoices / Messages), no sidebar at all. This is the one part of the product that should feel like a **lightweight companion app**, not a dense internal tool — clients are occasional users who need clarity, not power.

**Sidebar structure:** None — top nav only, by design, to reduce cognitive load for infrequent external users.

**Dashboard widgets (Portal Home):**
- Active projects (card per project, progress bar, next milestone date)
- Pending approvals (action-required, surfaced prominently at the top)
- Outstanding invoices (amount + due date, pay button)
- Recent messages preview

**Empty state:** "You don't have any active projects yet — your account team will share updates here once your project begins." Reassuring tone, since an empty client portal shouldn't feel broken or alarming to a paying client.

**Loading state:** Same skeleton-first philosophy, but simplified — fewer skeleton elements per screen given the portal's lighter information density.

**Error state:** Payment failure on invoice pay flow shows a clear, non-technical message ("Your card was declined — try another payment method") with a direct path to retry, never raw payment-gateway error text.

**Mobile behavior:** Portal is **mobile-first by default** — most clients will access via a shared link on their phone, not a desktop bookmark. Layout is single-column from the smallest breakpoint up; approval actions use large, thumb-friendly buttons (Approve/Request Changes) rather than small icon buttons.

**Accessibility:** Highest bar in the whole product, since external users may include people the tenant has no control over training/onboarding — plain-language labels (no internal jargon like "milestone" without context), large tap targets, straightforward linear reading order, full screen-reader labeling on approval actions with confirmation dialogs before destructive/binding actions (e.g., approving a final deliverable).

---

### B.7 Invoicing

**User Journey:**
Finance user (or automatically, on deal-won) creates an invoice from a deal/quote → reviews line items and tax → sends to client (via Client Portal + email) → tracks payment status → reconciles paid invoices → handles overdue follow-ups (often automation-driven).

**Screen Hierarchy:**
```
Invoicing
├── Invoices List (table, filterable by status: Draft/Sent/Paid/Overdue)
├── Invoice Detail
│   ├── Line items editor (Draft state) / read-only view (Sent+)
│   ├── Payment history
│   ├── Related deal/project link
│   └── Activity log (viewed by client, reminders sent)
├── Invoice Builder (creation flow — multi-step or single-page form)
└── Tax/Currency Settings (admin)
```

**Navigation:** List view is the default landing (status-filter tabs across the top: All/Draft/Sent/Overdue/Paid — Overdue gets a distinct color treatment as the "needs attention" tab). Invoice Detail opens full-page given its legal/financial weight (never a lightweight drawer for anything with monetary and legal significance).

**Sidebar structure:**
```
Invoicing
 ├─ All Invoices
 ├─ Drafts
 ├─ Overdue
 ├─ Paid
 └─ Settings (tax rules, numbering, templates)
```

**Dashboard widgets:**
- Outstanding balance (total $ across unpaid invoices)
- Overdue invoices count + aging bucket chart (0-30/31-60/60+ days)
- Revenue this month vs. last (trend)
- Upcoming due invoices (7-day lookahead)

**Empty state:** "No invoices yet — create one manually or generate from a won deal." Reinforces the deal→invoice bridge explicitly in the empty-state copy so new users discover the automation path, not just manual entry.

**Loading state:** Table skeleton with placeholder amount/status pill shapes; amounts always right-aligned even in skeleton form to avoid a layout jump when real data loads.

**Error state:** Failed send (e.g., invalid client email) surfaces inline on the invoice detail with a clear fix-path ("Update client email to send"), not a silent failure buried in a log only an admin would find.

**Mobile behavior:** List view is fully usable on mobile (finance follow-up often happens on the go); Invoice Builder's multi-line-item editor is the one flow that nudges toward desktop ("For the best experience creating invoices with many line items, we recommend desktop") without fully blocking mobile use — a soft nudge, not a hard wall.

**Accessibility:** Monetary values always paired with explicit currency code/symbol (never ambiguous, especially important with multi-currency tenants); status pills use icon + text (not color alone) — e.g., "● Overdue" with both a red dot and the word.

---

### B.8 Commission Tracking

**User Journey:**
Admin sets up commission plans/rules → as deals close (Won) or invoices get paid, commissions auto-accrue per the applicable plan → reps view their own accrued/pending/paid commissions → admin runs payout batches → reps get notified on payout.

**Screen Hierarchy:**
```
Commissions
├── My Commissions (rep-facing default view)
│   ├── Accrued (pending payout)
│   ├── Paid (history)
│   └── Breakdown by deal (drill-in)
├── Commission Plans (admin) — list + builder
├── Payout Runs (admin) — batch review & approve
└── Ledger/Audit view (admin — full transaction history)
```

**Navigation:** Reps and admins see **fundamentally different landing views** based on role — a rep opens Commissions to "My Commissions" (personal, simple); an admin opens to a plan/payout management console. Same module, role-adapted entry point — this avoids cluttering a rep's experience with admin controls they can't use anyway.

**Sidebar structure (admin view):**
```
Commissions
 ├─ My Commissions
 ├─ All Reps (admin)
 ├─ Commission Plans
 ├─ Payout Runs
 └─ Ledger
```
(Rep view sidebar shows only "My Commissions" and "Payout History" — reduced per RBAC.)

**Dashboard widgets:**
- Rep view: This month's accrued total, next payout date, YTD earnings trend
- Admin view: Total pending payout liability, payout run status, top earners this quarter

**Empty state:** Rep with no commissions yet: "Your commissions will appear here once you close your first deal" — sets expectation rather than looking broken. Admin with no plans configured: "Set up your first commission plan to start tracking payouts," CTA into the plan builder.

**Loading state:** Numeric widgets (totals, YTD) show a skeleton "shimmer bar" in place of the dollar figure specifically — never show a flash of "$0" before real data loads, which would misleadingly suggest zero earnings for a split second.

**Error state:** Commission calculation discrepancy (e.g., a plan rule conflict) flags the affected ledger entry with a visible warning icon and a "Needs review" status, routed to an admin queue — errors in a money-related module are never silently swallowed or auto-resolved without an audit trail.

**Mobile behavior:** Rep's "My Commissions" view is fully mobile-optimized (reps checking earnings on the go is a very common real use case) — clear big numbers, simple history list. Admin plan-builder and payout-run review are desktop-oriented (complex rule configuration), with mobile showing a read-only summary and a "Open on desktop to manage" prompt for edit actions.

**Accessibility:** All monetary figures readable by screen readers with full currency context; status changes (e.g., payout processed) trigger a live-region announcement so screen-reader users get real-time confirmation without needing to re-navigate.

---

### B.9 AI Assistant

**User Journey:**
User triggers the assistant (global shortcut, floating trigger, or contextual "Ask AI" button embedded in a module) → types or speaks a natural-language request → assistant either answers directly (retrieval/summarization) or proposes an action (e.g., "Create a task for this," "Draft this email") → user reviews and confirms/edits before any action executes → assistant maintains context across the conversation and remembers relevant recent activity per session.

**Screen Hierarchy:**
```
AI Assistant
├── Global Assistant Panel (slide-in from right, available anywhere)
│   ├── Conversation thread
│   ├── Suggested prompts (contextual to current screen)
│   └── Action confirmation cards (inline, before execution)
├── Assistant Home (dedicated landing, for deeper sessions)
│   ├── Recent conversations
│   └── Saved/pinned prompts
└── Inline "Ask AI" affordances embedded in module contexts 
    (e.g., a sparkle icon inside a deal, invoice, or task)
```

**Navigation:** The assistant is **omnipresent, not a destination you must navigate to** — accessible via a persistent trigger (bottom-right floating button on desktop, dedicated tab on mobile) from literally any screen in the product, opening as a **non-modal slide-in panel** so the underlying screen remains visible/interactive alongside it (critical: the assistant should never feel like it's blocking the user's actual work).

**Sidebar structure:** None (it's a panel, not a sidebar-navigated section) — though "Assistant Home" for reviewing past conversations is reachable from the main sidebar as a lightweight entry.

**Dashboard widgets:** On the main Home dashboard, an "AI Suggestions" widget surfaces proactive, non-intrusive suggestions (e.g., "3 deals have had no activity in 10 days — want me to draft follow-ups?") — always dismissible, never nagging, and never auto-executes without explicit confirmation.

**Empty state:** First-open: a friendly intro with 3-4 example prompts tailored to the user's role (a rep sees pipeline-related examples, a PM sees project-related examples) rather than generic examples — personalization from the very first interaction.

**Loading state:** Streaming token-by-token response rendering (perceived speed — never wait for a full response before showing anything), with a subtle animated "thinking" indicator for the brief pre-stream gap, and a visible "Stop generating" control at all times during streaming.

**Error state:** If the assistant can't complete a request (permission denied on an underlying action, model provider failure), it responds in natural language explaining *why*, never a raw error code — e.g., "I can't approve this invoice on your behalf — you'll need to do that yourself," maintaining trust rather than a generic failure.

**Mobile behavior:** Dedicated bottom-tab entry (not just a floating button, which is harder to reliably place across all mobile screen sizes); full-screen conversation view on mobile rather than a side panel, given limited screen real estate; voice input prioritized as a primary input method on mobile given typing friction.

**Accessibility:** Full conversation history is screen-reader readable in linear order; streaming responses use ARIA live regions set to "polite" (not "assertive," to avoid interrupting a screen-reader user mid-sentence); every proposed AI action requires an explicit, clearly labeled confirm button — never an ambiguous auto-execute that a screen-reader user could miss.

---

### B.10 Analytics

**User Journey:**
User opens Analytics to answer a specific question ("How's this quarter's pipeline looking?") → selects or lands on a relevant pre-built dashboard → drills into a specific metric/chart for detail → optionally builds a custom report/dashboard → shares or schedules a recurring export.

**Screen Hierarchy:**
```
Analytics
├── Dashboard Gallery (pre-built + custom dashboards, card grid)
├── Dashboard View (selected dashboard, grid of widgets)
│   └── Widget Detail (drill-in, full-size chart + underlying data table)
├── Report Builder (custom dashboard/widget creation flow)
└── Scheduled Exports (admin — recurring email/CSV delivery config)
```

**Navigation:** Gallery-first landing (module-specific pre-built dashboards: Sales, Projects, Recruitment, Finance) rather than one monolithic dashboard — respects that different roles care about entirely different metrics, and avoids an overwhelming single mega-dashboard.

**Sidebar structure:**
```
Analytics
 ├─ Overview (default org-wide dashboard)
 ├─ Sales
 ├─ Projects
 ├─ Recruitment
 ├─ Finance
 ├─ My Dashboards (custom, personal)
 └─ Report Builder
```

**Dashboard widgets (this module's widgets ARE the product surface, but on the global Home page, Analytics contributes):** a single "Key Metrics" summary strip (revenue, active deals, project health, open roles) as a cross-module glance, linking out to the full Analytics module for depth.

**Empty state:** Custom "My Dashboards" empty: "Build your first custom dashboard" with a CTA into Report Builder and a gallery of starter templates ("Weekly Sales Review," "Team Workload") to reduce blank-canvas paralysis.

**Loading state:** Widgets load independently and asynchronously (each chart shows its own skeleton and resolves on its own timeline) rather than blocking the whole dashboard on the slowest query — critical for a module aggregating across many other modules' data.

**Error state:** A single failed widget shows an inline "Couldn't load this chart — Retry" contained to that widget's card, never taking down the rest of the dashboard — isolation of failure is a core design requirement here given how many independent data sources feed this module.

**Mobile behavior:** Dashboards reflow to single-column, stacked widget cards; complex charts (multi-series line charts, detailed funnels) get a simplified mobile rendering (fewer series shown by default, "View full chart" opens a focused full-screen chart view) rather than cramming a desktop-density chart into a small viewport.

**Accessibility:** Every chart has a companion data-table view (toggle at the top-right of each widget) — this is non-negotiable given charts are inherently difficult for screen-reader/color-blind users; number formatting is locale-aware and never relies on color alone to distinguish series (patterns/labels supplement color).

---

### B.11 Workflow Automation

**User Journey:**
Admin/power-user opens Automation → browses existing workflows or starts new → builds via visual trigger→condition→action builder → tests/previews the workflow → activates it → monitors execution history/success rate → edits/pauses as needed.

**Screen Hierarchy:**
```
Automation
├── Workflows List (table: name, trigger, status, last run, success rate)
├── Workflow Builder (visual canvas)
│   ├── Trigger selector
│   ├── Condition branches
│   ├── Action step chain
│   └── Test/Preview panel
├── Execution History (per-workflow log of runs, drill into each run's steps)
└── Templates Gallery (pre-built common automations)
```

**Navigation:** Workflows List is the landing view; "New Workflow" opens either a blank canvas or the Templates Gallery first (nudging new users toward proven patterns like "Notify rep when lead goes cold" rather than a blank-canvas cold-start).

**Sidebar structure:**
```
Automation
 ├─ All Workflows
 ├─ Active
 ├─ Paused/Draft
 ├─ Templates
 └─ Execution Logs
```

**Dashboard widgets:**
- Active workflows count
- Executions this week (volume trend)
- Failed executions needing attention (flagged prominently — this is the "something's broken" widget)
- Most-triggered workflow (usage insight)

**Empty state:** "No automations yet — start from a template or build your own." Templates given equal or greater visual weight than the blank-canvas option, since automation-building can be intimidating for non-technical tenant admins — reducing that barrier is a genuine UX priority for this module specifically.

**Loading state:** Builder canvas loads with a skeleton of the trigger/action-chain shape if editing an existing workflow; a blank canvas for new workflows has no loading state needed (renders instantly, it's just an empty canvas).

**Error state:** A failed workflow execution surfaces in Execution History with the **specific failing step highlighted** (not just "workflow failed") — e.g., "Step 3 (Send Email) failed: invalid recipient" — because debugging automations without step-level detail is a top frustration in comparable tools (this is an explicit differentiation point vs. weaker competitors).

**Mobile behavior:** The visual builder is **desktop-only** by explicit design decision — building multi-step conditional logic on a small touchscreen is a poor experience in every tool that's attempted it. Mobile shows Workflows List (view status, toggle active/paused) and Execution History (monitor) in read/light-control mode, with a clear "Open on desktop to edit" prompt for the builder itself.

**Accessibility:** The canvas-based builder, while visual by nature, provides a **fully keyboard-operable list-based alternate editing mode** ("Edit as list" toggle showing the same trigger/condition/action chain as a structured, focusable list of steps) — ensures the module isn't inaccessible to keyboard-only or screen-reader users despite its visual-canvas default.

---

### B.12 Team Management

**User Journey:**
Admin invites team members → assigns roles/permissions → organizes into teams/departments → manages ongoing access (deactivate, role changes) → individual users manage their own profile/notification preferences → admin reviews team workload/utilization.

**Screen Hierarchy:**
```
Team Management
├── Team Members List (table: name, role, status, last active)
│   └── Member Detail (drawer)
│       ├── Profile & role assignment
│       ├── Permissions overview (effective permissions, read-only summary)
│       └── Activity log
├── Roles & Permissions (admin config)
│   └── Role Detail/Editor (permission matrix)
├── Teams/Departments (org structure)
└── My Profile (personal settings — every user's own view)
```

**Navigation:** Members List is the default admin landing; every individual user also has direct access to "My Profile" regardless of role (reachable from the top-bar avatar menu, not buried inside this module's admin-oriented sidebar) — separating "manage others" (admin task, sidebar-driven) from "manage myself" (universal, top-bar-driven).

**Sidebar structure (admin view):**
```
Team
 ├─ Members
 ├─ Roles & Permissions
 ├─ Teams/Departments
 └─ Invitations Pending
```

**Dashboard widgets:**
- Team size + growth trend
- Pending invitations count
- Role distribution (breakdown chart)
- Recently active vs. dormant accounts (admin housekeeping widget)

**Empty state:** New tenant, only the owner exists: "Invite your team to get started" with a prominent invite-by-email flow (supports bulk paste of multiple emails at once, since this is often a one-time bulk action during onboarding).

**Loading state:** Member list skeleton with placeholder avatar + name/role bars; Role permission-matrix editor shows a skeleton grid matching the eventual checkbox-matrix shape.

**Error state:** Invite failure (invalid email, already-invited duplicate) surfaces inline per-row in a bulk-invite flow — e.g., row 3 shows a red inline note "Already a member" — rather than failing the entire batch invite silently or all-or-nothing.

**Mobile behavior:** Member list and profile management fully usable on mobile (checking who's on the team, updating your own notification prefs are common on-the-go tasks); the Roles & Permissions matrix editor is desktop-oriented given its dense grid nature, with mobile offering a read-only "View my permissions" summary instead of the full editing matrix.

**Accessibility:** Permission matrix (rows = permissions, columns = roles) is one of the densest UI surfaces in the product — provided with full keyboard grid-navigation (arrow keys move between cells, space toggles), and an alternate accessible-list rendering ("View as list per role") for users who find grid navigation difficult, mirroring the same "canvas + list alternate" principle used in the Automation Builder.

---

## Part C — Cross-Module Consistency Rules (Design System Enforcement)

These rules exist so that, despite 12 distinct modules, the product feels like one coherent system rather than a suite of separately-designed tools — a common failure mode in sprawling SaaS platforms this brief must explicitly guard against.

1. **Kanban modules (Leads, Pipeline, Recruitment) share identical interaction patterns**: same card anatomy, same drag-drop behavior, same mobile single-column-swipe fallback, same keyboard/menu equivalent for stage changes. A user who learns Pipeline already knows Leads and Recruitment.
2. **Detail view choice (drawer vs. full page) is governed by content depth, not module identity**: Contacts/Leads/Candidates use drawers (lighter objects); Deals/Projects/Invoices use full pages (richer, multi-tab objects). This rule is applied consistently rather than each module inventing its own pattern.
3. **Every list view has the same anatomy**: filter/segment bar → column header row → skeleton-then-real rows → consistent row-hover action affordances (view, quick-edit, more-menu) in the same screen position across every module.
4. **Every money-related module (Invoicing, Commissions) shares stricter treatment**: full-page detail views only (never drawers), explicit currency labeling always, audit-first error handling, no silent auto-corrections.
5. **Every builder-type interface (Automation Workflow Builder, Role Permission Editor)** provides a non-visual/list-based alternate mode as a system-wide accessibility guarantee, not a module-specific afterthought.
6. **Empty states always follow the same three-part formula**: human sentence → primary CTA → optional secondary path (template/import/sample). No module gets a bare "No data" screen.
7. **Color usage is standardized platform-wide**: status colors (success green, warning amber, danger red, info blue, neutral gray) map to the *same meaning* in every module — a red dot never means "urgent" in one module and "error" in another.

---

*This specification defines behavior and structure ahead of visual design. Next steps: high-fidelity mockups per screen, an interactive prototype of the Kanban interaction pattern (since it's reused across three modules and is the highest-risk interaction to get right), and a usability test plan prioritizing the AI Assistant and Automation Builder — the two most novel interaction models in the product.*
