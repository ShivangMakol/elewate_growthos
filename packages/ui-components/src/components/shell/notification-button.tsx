import { Bell } from "lucide-react";

import { Button } from "../button";
import { Tooltip, TooltipTrigger, TooltipContent } from "../tooltip";

export interface NotificationButtonProps {
  /** Purely visual — whether to show the unread-indicator dot. No actual
   * notification data/count exists yet. */
  hasUnread?: boolean;
}

/**
 * Layout placeholder only — no notification panel/list is attached, and
 * clicking does nothing. Real notification delivery is
 * platform/notifications business logic for a later milestone.
 */
function NotificationButton({ hasUnread = false }: NotificationButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell />
          {hasUnread && (
            <span
              aria-hidden="true"
              className="bg-destructive absolute top-1.5 right-1.5 size-2 rounded-full"
            />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Notifications</TooltipContent>
    </Tooltip>
  );
}

export { NotificationButton };
