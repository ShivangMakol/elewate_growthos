"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

/**
 * Shared dark-mode provider. Each app wraps its root layout with this once —
 * no per-app dark-mode logic, keeping the "Shared Theme" requirement real
 * rather than three independent implementations.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
