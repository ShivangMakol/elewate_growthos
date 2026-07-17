# platform/

Cross-cutting concerns shared by all 12 business modules — Architecture Blueprint §5.

Every module in `src/modules/` depends on these; these must never depend back on a
business module. This is the layer that made the M0 tooling milestone a hard
prerequisite for everything else (see Implementation Roadmap §1).

| Folder              | Purpose                                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenancy/`          | Tenant provisioning, tenant resolution, tenancy-tier logic (shared RLS → dedicated schema → dedicated instance)                                                                  |
| `iam/`              | Identity & Access — authentication, RBAC+ABAC authorization (Architecture §8, §9)                                                                                                |
| `audit/`            | Audit & Compliance — hash-chained, append-only audit event log (Architecture §13)                                                                                                |
| `notifications/`    | Central Notification Bus — multi-channel delivery, templates (Architecture §14)                                                                                                  |
| `file-storage/`     | File storage strategy — S3-backed, pointer pattern (Architecture §15)                                                                                                            |
| `event-bus/`        | Domain event publication/subscription — the asynchronous communication backbone consumed by Automation, Analytics, Notifications, and the AI context indexer (Architecture §2.4) |
| `ai-orchestration/` | AI Assistant's cross-module tool-calling orchestration layer (Architecture §16)                                                                                                  |

No application code exists yet — built in M0 (tenancy, iam, audit, event-bus,
file-storage, notifications skeleton) and M12 (ai-orchestration).
