#!/usr/bin/env bash
# Polls `docker compose ps` until every service in this compose project is
# either "healthy" or, for services with no healthcheck, "running". Exits
# non-zero if the timeout is hit, printing whatever state it last saw so a
# failure is diagnosable rather than a silent hang.
set -euo pipefail

TIMEOUT_SECONDS="${WAIT_TIMEOUT_SECONDS:-90}"
INTERVAL_SECONDS=2
elapsed=0

echo "Waiting for docker compose services to become healthy (timeout: ${TIMEOUT_SECONDS}s)..."

while true; do
  # docker compose ps --format json emits one JSON object per line (v2 CLI).
  states="$(docker compose ps --format json 2>/dev/null || true)"

  if [ -z "$states" ]; then
    echo "No services found yet — has 'docker compose up' been run?"
  else
    unhealthy=$(echo "$states" | node -e '
      let input = "";
      process.stdin.on("data", (d) => (input += d));
      process.stdin.on("end", () => {
        const lines = input.trim().split("\n").filter(Boolean);
        let bad = [];
        for (const line of lines) {
          const svc = JSON.parse(line);
          const health = svc.Health || "";
          const state = svc.State || "";
          const ok =
            health === "healthy" ||
            (health === "" && state === "running") ||
            svc.ExitCode === 0; // one-shot init containers (minio-init) that already exited 0
          if (!ok) bad.push(`${svc.Service}: state=${state} health=${health || "n/a"}`);
        }
        console.log(bad.join("\n"));
      });
    ')

    if [ -z "$unhealthy" ]; then
      echo "All services healthy."
      exit 0
    fi
    echo "Still waiting on:"
    echo "$unhealthy"
  fi

  if [ "$elapsed" -ge "$TIMEOUT_SECONDS" ]; then
    echo "Timed out after ${TIMEOUT_SECONDS}s waiting for services to become healthy."
    docker compose ps
    exit 1
  fi

  sleep "$INTERVAL_SECONDS"
  elapsed=$((elapsed + INTERVAL_SECONDS))
done
