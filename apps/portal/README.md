# apps/portal

Lightweight client-portal SPA (external users) — Architecture Blueprint §5.

Serves the Client Portal module (magic-link/SSO auth, project/milestone visibility,
approvals, invoice payment) to external clients — a distinct, more restricted surface
from `apps/web`, which is for internal team members only. Kept as a separate app
rather than a route inside `apps/web` so that external-user auth and internal-user
auth never share a session boundary.

No application code yet — introduced in M8 per the Task List.
