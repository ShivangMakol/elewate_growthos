# services/core-api

The modular monolith — Architecture Blueprint §5 / §2.2.

Hosts all 12 business modules (`src/modules/`) and the cross-cutting platform layer
(`src/platform/`) behind a single deployable API, following Clean Architecture layering
throughout: `domain/` (pure business logic, no I/O) → `application/` (use cases,
orchestration) → `infrastructure/` (persistence, external adapters) → `interface/`
(GraphQL resolvers, REST controllers).

**Design rule (Architecture §3):** No module directly queries another module's database
tables. All cross-module reads go through application service interfaces or the
read-optimized query/reporting layer.

**Extraction rule (Architecture §5):** a module folder should be deletable wholesale
without breaking the compile of unrelated modules (aside from `shared-kernel/` and
`platform/`). This is what keeps later extraction to a standalone service viable.

| Folder               | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `src/modules/`       | The 12 business bounded contexts                   |
| `src/platform/`      | Cross-cutting concerns shared by all modules       |
| `src/shared-kernel/` | Truly shared value objects (Money, Email, Address) |
| `src/bootstrap/`     | DI container, app wiring, config loading           |
| `test/e2e/`          | End-to-end tests spanning multiple modules         |

No application code exists yet.
