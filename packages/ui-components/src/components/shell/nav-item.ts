import type { ComponentType } from "react";

/**
 * Layout-only nav item shape. `onSelect` is intentionally the only behavior
 * hook — this milestone builds the shell, not routing or RBAC-based
 * filtering (UX Spec A.2: "modules a role can't access never render" is
 * real module/business-logic behavior for a later milestone, not the shell
 * itself).
 */
export interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}
