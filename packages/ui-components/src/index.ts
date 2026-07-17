/**
 * @elewate/ui-components
 *
 * Design system (white-label themeable) — Architecture Blueprint §5.
 * Shared across apps/web, apps/admin, apps/portal so "Shared Theme" is a real
 * single source of truth rather than three independent implementations.
 *
 * Scope note: only the primitives needed for the app-shell milestone exist so
 * far (Button, Card, ThemeProvider, ThemeToggle, cn utility, shared theme.css).
 * The full shadcn/ui-style component library and the shared KanbanBoard
 * component are introduced in later milestones per the Task List (M0 base
 * primitives, M3 KanbanBoard).
 */

export { Button, buttonVariants, type ButtonProps } from "./components/button";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./components/card";
export { ThemeProvider } from "./components/theme-provider";
export { ThemeToggle } from "./components/theme-toggle";
export { cn } from "./lib/utils";

export const UI_COMPONENTS_PACKAGE_VERSION = "0.0.0";
