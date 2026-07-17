# automation — Workflow Automation

Bounded context per Architecture Blueprint §3 (Module Breakdown).

**Core Responsibility:** Trigger→condition→action engine

**Key Aggregates:** Workflow, Trigger, ActionStep

**Emits Events:** `workflow.executed`, `workflow.failed`

## Layout (TDD §5)

- `domain/` — entities, value objects, domain events (pure business logic, no I/O)
- `application/` — commands, queries, DTOs (use case orchestration)
- `infrastructure/` — repositories, mappers, adapters (persistence, external calls)
- `interface/` — GraphQL resolvers and REST controllers for this module
- `__tests__/` — unit, integration, and fixtures, mirroring the source structure 1:1 (TDD §5 rule)

**Design rule (Architecture §3):** no other module may query this module's database
tables directly. Cross-module reads go through this module's application service
interface or the read-optimized analytics layer.

No application code exists yet — see the Task List for this module's build milestone.
