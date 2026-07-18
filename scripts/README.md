# scripts/

Developer scripts for the local Docker Compose environment (`docker-compose.yml` at
repo root). Not part of the deployed application — these never run in staging/
production, only on a developer's machine.

| Script                 | Purpose                                                                                                                                                                                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setup.sh`             | One-command environment bring-up: creates `.env` from `.env.example` if missing, builds and starts the full compose stack, waits for every service to report healthy, then prints where each service is reachable. Run via `pnpm run dev:setup`.                                                   |
| `wait-for-services.sh` | Polls `docker compose ps` until every service is `healthy` (or `running`, for services with no healthcheck defined) or a one-shot init container has exited `0`. Exits non-zero with a diagnosable state dump if the timeout is hit, rather than hanging silently. Run via `pnpm run docker:wait`. |
| `reset.sh`             | Stops the stack and deletes all local data volumes (Postgres, Redis, MinIO). Destructive — asks for confirmation before doing anything. Run via `pnpm run dev:reset`.                                                                                                                              |

## Related root package.json scripts

| Script                  | Does                                 |
| ----------------------- | ------------------------------------ |
| `pnpm run dev:setup`    | Runs `setup.sh`                      |
| `pnpm run dev:reset`    | Runs `reset.sh`                      |
| `pnpm run docker:up`    | `docker compose up -d`               |
| `pnpm run docker:down`  | `docker compose down`                |
| `pnpm run docker:build` | `docker compose build`               |
| `pnpm run docker:logs`  | `docker compose logs -f`             |
| `pnpm run docker:ps`    | `docker compose ps`                  |
| `pnpm run docker:wait`  | Runs `wait-for-services.sh` directly |

## Verification note

This environment was authored and tested in a sandbox where the Docker daemon runs
correctly but the egress proxy blocks `registry-1.docker.io` (confirmed directly:
`docker pull` returns `403 Forbidden`), so a real end-to-end boot (actually pulling
Postgres/Redis/MinIO/Mailpit images and confirming all five containers reach
`healthy`) could not be performed there. What _was_ verified there:

- `docker compose config --quiet` — full schema + variable-interpolation validation,
  zero errors.
- A real `docker compose up -d` attempt correctly resolved the dependency graph for
  all 5 services and reached the image-pull stage for each before failing uniformly
  on the registry block — confirming the failure is the network boundary, not a
  config error.
- All three scripts pass `bash -n` (syntax validation).

Run `pnpm run dev:setup` on a machine with normal internet access to perform the real
first boot.
