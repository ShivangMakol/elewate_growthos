# bootstrap/

DI container, app wiring, config loading — Architecture Blueprint §5.

The composition root: where all modules, platform services, and infrastructure
adapters get wired together into a running application. Nothing outside this folder
should know how the DI container is configured.

**Status:** Bootstrap built — Fastify server (`create-server.ts`) wiring the Hybrid
REST + GraphQL surface (Architecture §6.1) via Mercurius. Deliberately minimal:
`GET /health` REST endpoint and a single-field `_health` GraphQL query, nothing more.

No authentication, no database logic, and no business modules are wired in yet — real
DI-container wiring for those lands as each is introduced (see the Task List). The
entry point (`src/main.ts`, one level up) imports `createServer` from here and starts
listening.
