import { Sparkles } from "lucide-react";

import { Button } from "../button";
import { Tooltip, TooltipTrigger, TooltipContent } from "../tooltip";

/**
 * Layout placeholder only — no AI panel is attached, and clicking does
 * nothing. Real AI Assistant behavior (tool-calling, confirm-before-execute,
 * per Architecture §16) lands at Milestone M12 per the Task List, far after
 * this shell.
 */
function AIButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="AI Assistant">
          <Sparkles />
        </Button>
      </TooltipTrigger>
      <TooltipContent>AI Assistant</TooltipContent>
    </Tooltip>
  );
}

export { AIButton };
