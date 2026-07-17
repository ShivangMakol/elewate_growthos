# permissions-schema

RBAC permission definitions — Architecture Blueprint §5.

Shared between `core-api`'s IAM authorization middleware (Architecture §9: RBAC + ABAC
Hybrid) and any frontend that needs to conditionally render UI by permission (e.g.
hiding the Role Editor from a user without `team:manage`).

No definitions exist yet — introduced alongside IAM in M0, extended as each module
introduces its own permission set (Architecture §3: every module exposes "a permission
set (for RBAC)").
