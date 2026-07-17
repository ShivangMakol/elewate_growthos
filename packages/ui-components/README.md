# ui-components

Design system (white-label themeable) — Architecture Blueprint §5.

Shared React component library consumed by `apps/web`, `apps/admin`, and `apps/portal`.
"White-label themeable" per Architecture §10.4: components must read visual identity
(colors, logo, fonts) from tenant/partner configuration via CSS custom properties, not
hardcoded values — this is what lets the Partner → Partner's Clients white-label tier
(Task List M13) reskin the product without a fork.

Built so far (app-shell milestone): `Button`, `Card` (+ subcomponents), `ThemeProvider`,
`ThemeToggle`, the `cn()` utility, and the shared `theme.css` design tokens consumed via
`@elewate/ui-components/theme.css`. The full shadcn/ui-style library and the shared
KanbanBoard component are introduced in later milestones per the Task List (M3
KanbanBoard).
