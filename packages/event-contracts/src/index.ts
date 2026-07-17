/**
 * @elewate/event-contracts
 *
 * Shared event/DTO schemas (versioned) — Architecture Blueprint §5.
 * Zod schemas defined once per DTO, imported by both the API layer (request
 * validation) and the frontend (client-side pre-validation) — TDD §9.2.
 *
 * No event contracts are defined yet. Real contracts (e.g. `LeadConvertedEvent`,
 * `DealWonEvent`) are added starting with the Platform event bus in M0 and
 * extended as each module starts emitting real events (M2+) — see the Task List.
 *
 * This file exists only to give the package a valid, buildable TypeScript
 * entry point ahead of that content landing.
 */

export const EVENT_CONTRACTS_PACKAGE_VERSION = "0.0.0";
