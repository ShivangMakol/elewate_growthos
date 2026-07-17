/**
 * @elewate/ui-components
 *
 * Design system (white-label themeable) — Architecture Blueprint §5.
 * Purely-presentational components (Button, Input, Table, Drawer) consuming
 * CSS variables/theme tokens rather than hardcoded colors (TDD §7), plus the
 * shared KanbanBoard component reused across Leads, Pipeline, and Recruitment
 * (TDD §7).
 *
 * No components are defined yet — this package is configured (package.json,
 * tsconfig, workspace/peer dependencies) but intentionally contains no
 * component implementations. Base primitives are introduced in M0; the shared
 * KanbanBoard is introduced in M3 — see the Task List.
 *
 * This file exists only to give the package a valid, buildable TypeScript
 * entry point ahead of that content landing.
 */

export const UI_COMPONENTS_PACKAGE_VERSION = "0.0.0";
