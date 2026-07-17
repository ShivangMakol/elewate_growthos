# event-contracts

Shared event/DTO schemas (versioned) — Architecture Blueprint §5.

The single source of truth for domain event payloads (e.g. `lead.converted`,
`invoice.paid` — Architecture §2.4). Every module that publishes or subscribes to a
domain event imports its contract from here rather than redefining the shape locally.
Automation (M10) and Analytics (M11) depend heavily on these contracts being stable
before they're built.

No contracts exist yet — the first ones are defined alongside the Platform event bus
in M0, then extended as each module starts emitting real events (M2+).
