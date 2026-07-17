# ui-components

Design system (white-label themeable) — Architecture Blueprint §5.

Shared React component library consumed by `apps/web`, `apps/admin`, and `apps/portal`.
"White-label themeable" per Architecture §10.4: components must read visual identity
(colors, logo, fonts) from tenant/partner configuration via CSS custom properties, not
hardcoded values — this is what lets the Partner → Partner's Clients white-label tier
(Task List M13) reskin the product without a fork.

No application code exists yet — base primitives (Button, Input, Drawer, Table shell)
are introduced in M0; the shared Kanban component (reused across Leads, Pipeline,
Recruitment) is introduced in M3.
