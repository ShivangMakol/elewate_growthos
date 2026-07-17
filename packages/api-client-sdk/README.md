# api-client-sdk

Typed client for web/mobile — Architecture Blueprint §5.

Wraps `services/core-api`'s REST + GraphQL surface (Architecture §6.1) in a typed
client so `apps/web`, `apps/admin`, `apps/mobile`, and `apps/portal` never hand-write
fetch calls or duplicate response-shape assumptions.

No application code exists yet.
