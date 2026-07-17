# apps/

Client applications — the deployable, user-facing entry points into Elewate GrowthOS.
Per Architecture Blueprint §5, each app is a thin presentation layer that talks to
`services/core-api` via the typed client in `packages/api-client-sdk`; no business
logic lives here.

| App       | Purpose                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------- |
| `web/`    | Next.js tenant-facing app (white-labelable) — the main product surface for internal team users      |
| `admin/`  | Internal super-admin console (platform ops) — tenant provisioning, platform-level oversight         |
| `mobile/` | React Native app — mobile access to the same core modules                                           |
| `portal/` | Lightweight client-portal SPA (external users) — scoped view for clients, not internal team members |

No application code exists yet in any of these — see the Task List for the milestone
that introduces each one.
