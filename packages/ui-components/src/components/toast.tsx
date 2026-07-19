"use client";

import type { CSSProperties } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Built on `sonner` rather than a hand-rolled Radix Toast: it already
 * handles stacking, swipe-to-dismiss, and — critically for UX Spec A.4
 * ("Toast/banner for transient failures ... with a Retry action") — a
 * built-in `action: { label, onClick }` option on every `toast()` call, so
 * that pattern needs no custom wrapper API here. Sonner also announces
 * toasts via an internal live region, satisfying "live regions announce
 * async state changes" (UX Spec A.4) without extra wiring.
 *
 * Mount exactly one `<Toaster />` at each app's root (alongside
 * ThemeProvider) once a module actually needs to trigger toasts — not done
 * yet, since no module exists to trigger one from. Import and call the
 * `toast` function from `sonner` directly wherever a toast needs firing.
 */
function Toaster({ ...props }: ToasterProps) {
  const { resolvedTheme } = useTheme();
  const theme: ToasterProps["theme"] =
    resolvedTheme === "dark" || resolvedTheme === "light" ? resolvedTheme : "system";

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
export { toast } from "sonner";
