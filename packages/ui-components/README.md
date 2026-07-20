# ui-components

Design system (white-label themeable) — Architecture Blueprint §5.

Shared React component library consumed by `apps/web`, `apps/admin`, and `apps/portal`.
"White-label themeable" per Architecture §10.4: components must read visual identity
(colors, logo, fonts) from tenant/partner configuration via CSS custom properties, not
hardcoded values — this is what lets the Partner → Partner's Clients white-label tier
(Task List M13) reskin the product without a fork.

Built so far (design system foundation milestone):

**Tokens** (`theme.css`, consumed via `@elewate/ui-components/theme.css`):

- Color — light/dark pairs incl. semantic status colors (success/warning/info/destructive), deliberate indigo/violet accent (placeholder pending real visual design, see file comments)
- Typography — font family stack (Inter, not yet loaded as a webfont — that's a per-app `next/font` concern), size/line-height/weight scale
- Spacing — 4px base grid (`--spacing`)
- Radius — `sm`/`md`/`lg`/`xl`/`full`

**Providers:** `ThemeProvider` (dark mode, next-themes), `TooltipProvider` (exported for apps to mount at root once needed)

**Components (exactly 8, deliberately no more):** `Button`, `Input`, `Card` (+ `CardHeader`/`CardTitle`/`CardDescription`/`CardAction`/`CardContent`/`CardFooter`), `Modal`, `Drawer`, `Table` (+ subcomponents), `Toaster`/`toast` (Sonner-based), `Tooltip`. Modal and Drawer both built on `@radix-ui/react-dialog` for real focus-trap/Escape/return-focus behavior (UX Spec A.4/A.6) rather than reimplementing it. `ThemeToggle` also still exists from the earlier app-shell milestone (not one of the 8, kept as-is).

No additional components (Select, Checkbox, KanbanBoard, etc.) until a later milestone actually needs them — KanbanBoard specifically lands at M3 per the Task List.

**Global application shell** (`AppShell` and its pieces, under `components/shell/`): `TopBar`, `Sidebar`, `WorkspaceSwitcher`, `NotificationButton`, `AIButton`, `CommandPalette`, `MobileNavDrawer`, `MobileBottomTabBar` — composed together by `AppShell`. Structure matches UX Spec A.2 exactly (top-bar element order, sidebar sections, collapse/hover-peek behavior, active-item accent border). Layout only, per explicit instruction: no routing, no RBAC-based item filtering, no real search/AI/notifications/command behavior — each component's own file comments say exactly what's real (sidebar collapse state, responsive breakpoint switching, the Cmd+K listener) versus placeholder (everything else). Deliberately no Avatar/user-menu component — not in that task's explicit list, even though the UX Spec diagram shows one.

**Verification note (8 base components):** all exercised together via a temporary page rendered through `apps/web`'s real Next.js build and production server (HTTP 200, correct content, compiled CSS inspected directly for the token values and animation utilities), then removed — not left as a permanent addition. Deeper interaction testing (does the focus trap actually hold focus, does Escape actually close) would need Playwright, which isn't wired into this repo yet; the underlying Radix primitives are heavily-tested libraries for exactly that behavior, so this was judged sufficient for this milestone rather than blocking on new test infrastructure.

**Verification note (global application shell):** exercised via a temporary page in `apps/web` mounting `AppShell` with the real 11-module nav list from the UX Spec, built and served for real (HTTP 200, every module label present in the rendered output), then removed — not left as a permanent addition. Responsive breakpoint CSS confirmed compiled by inspecting the built output directly (a real `@media (min-width: 48rem)` rule with the expected `md:*` classes), not assumed from the source alone.
