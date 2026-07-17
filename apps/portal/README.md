# apps/portal

Lightweight client-portal SPA (external users) — Architecture Blueprint §5.

Serves the Client Portal module (magic-link/SSO auth, project/milestone visibility,
approvals, invoice payment) to external clients — a distinct, more restricted surface
from `apps/web`, which is for internal team members only. Kept as a separate app
rather than a route inside `apps/web` so that external-user auth and internal-user
auth never share a session boundary.

**Status:** App shell built — same stack as `apps/web`/`apps/admin`. Only page is the
placeholder dashboard — no business logic. The real Client Portal module lands at M8
per the Task List.
