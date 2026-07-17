/**
 * @elewate/permissions-schema
 *
 * RBAC permission definitions — Architecture Blueprint §5.
 * Shared between core-api's IAM authorization middleware (RBAC + ABAC hybrid,
 * Architecture §9) and any frontend that needs to conditionally render UI by
 * permission (e.g. hiding the Role Editor from a user without `team:manage`).
 *
 * No permission definitions exist yet — introduced alongside IAM in M0,
 * extended as each module introduces its own permission set (Architecture §3:
 * every module exposes "a permission set (for RBAC)").
 *
 * This file exists only to give the package a valid, buildable TypeScript
 * entry point ahead of that content landing.
 */

export const PERMISSIONS_SCHEMA_PACKAGE_VERSION = "0.0.0";
