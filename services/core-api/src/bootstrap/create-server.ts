import Fastify, { type FastifyInstance } from "fastify";
import mercurius from "mercurius";

import { schema, resolvers } from "./graphql-schema.js";
import { checkDatabaseConnection } from "./postgres-client.js";

/**
 * Composition root — Architecture Blueprint §5 ("bootstrap/ — DI container,
 * app wiring, config loading").
 *
 * Wires the Hybrid REST + GraphQL surface described in Architecture §6.1:
 * GraphQL as the primary contract (single `/graphql` endpoint, TDD §3.2),
 * REST alongside it. Deliberately bootstrap-only:
 *
 *   - No authentication (no `platform/iam` wiring yet)
 *   - No database logic (no `platform/tenancy`, no repositories)
 *   - No business modules registered (`src/modules/*` untouched)
 *
 * Real wiring for each of the above lands in the milestone that introduces
 * it — see the Task List.
 */
export function createServer(): FastifyInstance {
  const app = Fastify({
    logger: true,
  });

  // REST surface (Architecture §6.1) — health check only at this stage.
  // Real per-module REST controllers live in each module's own
  // interface/rest/ folder (TDD §5) once modules exist.
  app.get("/health", async (_request, reply) => {
    const db = await checkDatabaseConnection();
    if (!db.connected) {
      return reply.code(503).send({ status: "degraded", service: "core-api", database: db });
    }
    return { status: "ok", service: "core-api", database: db };
  });

  // GraphQL surface (Architecture §6.1, TDD §3.2).
  app.register(mercurius, {
    schema,
    resolvers,
    graphiql: true,
  });

  return app;
}
