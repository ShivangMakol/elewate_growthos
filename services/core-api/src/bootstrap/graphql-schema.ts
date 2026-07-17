/**
 * Bootstrap-only GraphQL schema — Architecture §6.1 / TDD §3.2 ("single
 * endpoint (/graphql), schema organized by module namespace, e.g.
 * `pipeline { deals }`, `crm { contacts }`").
 *
 * No business modules are registered yet, so no module namespaces exist.
 * This is just enough schema for Mercurius to start and for the GraphQL
 * surface to be verifiably real — not a placeholder for business fields.
 */

export const schema = `
  type Query {
    """
    Bootstrap-only field proving the GraphQL surface is wired end-to-end.
    Real module-namespaced queries (pipeline { deals }, crm { contacts }, ...)
    are added starting at Milestone M1 as each module lands.
    """
    _health: String!
  }
`;

export const resolvers = {
  Query: {
    _health: () => "ok",
  },
};
