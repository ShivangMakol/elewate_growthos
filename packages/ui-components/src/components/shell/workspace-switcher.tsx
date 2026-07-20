import { Building2, ChevronsUpDown } from "lucide-react";

import { Button } from "../button";

export interface WorkspaceSwitcherProps {
  workspaceName: string;
}

/**
 * Layout placeholder only — no dropdown menu is wired up (this design
 * system deliberately has no DropdownMenu/Select primitive yet), and
 * clicking does nothing. Real workspace-switching behavior is business
 * logic for a later milestone.
 */
function WorkspaceSwitcher({ workspaceName }: WorkspaceSwitcherProps) {
  return (
    <Button
      variant="ghost"
      className="gap-2 px-2"
      aria-label={`Current workspace: ${workspaceName}`}
    >
      <Building2 className="size-4 shrink-0" />
      <span className="max-w-32 truncate text-sm font-medium">{workspaceName}</span>
      <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0" />
    </Button>
  );
}

export { WorkspaceSwitcher };
