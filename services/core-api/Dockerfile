# syntax=docker/dockerfile:1
#
# Deliberately simple for this bootstrap-only milestone: installs the whole
# pnpm workspace rather than a pruned per-package subset (e.g. via
# `pnpm deploy`), because that's easier to reason about correctly without
# being able to fully verify a real `docker build` in the environment this
# was authored in. The Docker daemon itself runs fine there; the actual
# constraint is that the sandbox's egress proxy blocks registry-1.docker.io
# (confirmed directly: `docker pull` returns 403 Forbidden), so base images
# can't be pulled to test a full build end-to-end. Producing a leaner image
# via `pnpm deploy --prod` is a reasonable improvement once this can be
# verified by actually running it, likely during the M13 hardening milestone.

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @elewate/core-api build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/services/core-api ./services/core-api
WORKDIR /repo/services/core-api
EXPOSE 4000
CMD ["node", "dist/main.js"]
