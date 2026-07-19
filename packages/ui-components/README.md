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

**Verification note:** all 8 components were exercised together via a temporary page rendered through `apps/web`'s real Next.js build and production server (HTTP 200, correct content, compiled CSS inspected directly for the token values and animation utilities), then removed — not left as a permanent addition. Deeper interaction testing (does the focus trap actually hold focus, does Escape actually close) would need Playwright, which isn't wired into this repo yet; the underlying Radix primitives are heavily-tested libraries for exactly that behavior, so this was judged sufficient for this milestone rather than blocking on new test infrastructure.
