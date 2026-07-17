# bootstrap/

DI container, app wiring, config loading — Architecture Blueprint §5.

The composition root: where all modules, platform services, and infrastructure
adapters get wired together into a running application. Nothing outside this folder
should know how the DI container is configured.

No application code exists yet.
