# services/

Deployable backend units. Per Architecture Blueprint §5: "Deployable units (start as
one, split later)." Today this is a single modular monolith (`core-api`); the module
boundaries inside it are drawn deliberately so that any module can be extracted into
its own service later without rewriting domain logic — only the `interface/` and
`infrastructure/` layers change on extraction, per the Clean Architecture layering in
Architecture Blueprint §2.2.

| Service     | Purpose                                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `core-api/` | The modular monolith — hosts all 12 business modules and the cross-cutting platform layer behind a single deployable API (REST + GraphQL) |

No application code exists yet — see the Task List (M0–M13) for build order.
