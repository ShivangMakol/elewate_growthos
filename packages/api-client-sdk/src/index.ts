/**
 * @elewate/api-client-sdk
 *
 * Typed client for web/mobile (Architecture Blueprint §5), wrapping
 * services/core-api's REST + GraphQL surface (Architecture §6.1).
 *
 * No client methods exist yet — this file exists only to give the package a
 * valid, buildable TypeScript entry point, and to prove out the workspace
 * dependency on @elewate/event-contracts (TDD §9.2: the frontend imports the
 * same DTO schemas as the API layer for client-side pre-validation).
 *
 * Real request/mutation methods per module are added starting M1, once
 * services/core-api exposes real endpoints to wrap.
 */

import { EVENT_CONTRACTS_PACKAGE_VERSION } from "@elewate/event-contracts";

export const API_CLIENT_SDK_PACKAGE_VERSION = "0.0.0";

/** Proves the workspace + TS project reference to event-contracts resolves correctly. */
export const LINKED_EVENT_CONTRACTS_VERSION = EVENT_CONTRACTS_PACKAGE_VERSION;
