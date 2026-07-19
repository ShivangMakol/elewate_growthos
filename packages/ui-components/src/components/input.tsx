import * as React from "react";

import { cn } from "../lib/utils";

export type InputProps = React.ComponentProps<"input">;

/**
 * Error state is driven by `aria-invalid`, not a separate `error` prop —
 * the consumer sets `aria-invalid="true"` (and should pair it with
 * `aria-describedby` pointing at the error message) rather than this
 * component inventing its own validation-state API. Matches UX Spec A.4:
 * "Inline, field-level errors for forms."
 */
function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
