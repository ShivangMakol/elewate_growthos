# packages/

Shared libraries consumed by multiple apps and/or services. Per Architecture Blueprint
§5, these exist specifically to avoid duplicated type definitions or logic across the
apps/services boundary (e.g., the same event contract must not be independently
redefined in both `core-api` and `web`).

| Package               | Purpose                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui-components/`      | Design system (white-label themeable) — shared React components used by `apps/web`, `apps/admin`, `apps/portal`                                         |
| `api-client-sdk/`     | Typed client for web/mobile — generated/hand-written client wrapping `core-api`'s REST + GraphQL surface                                                |
| `event-contracts/`    | Shared event/DTO schemas (versioned) — the single source of truth for domain event payloads, imported by both backend publishers and any consumers      |
| `permissions-schema/` | RBAC permission definitions — shared between `core-api`'s authorization middleware and any frontend that needs to conditionally render UI by permission |
| `config/`             | Shared lint/tsconfig/build config — see `packages/config/README.md` (built in M0)                                                                       |
