/**
 * @elewate/ui-components
 *
 * Design system (white-label themeable) — Architecture Blueprint §5.
 * Shared across apps/web, apps/admin, apps/portal so "Shared Theme" is a real
 * single source of truth rather than three independent implementations.
 *
 * Design system foundation built so far: ThemeProvider (dark mode), color/
 * typography/spacing/radius tokens (theme.css), and 8 reusable components
 * (Button, Input, Card, Modal, Drawer, Table, Toast, Tooltip). Deliberately
 * scoped to only these — no additional components (Select, Checkbox, etc.)
 * until a later milestone actually needs them. The shared KanbanBoard
 * component lands at M3 per the Task List.
 */

export { Button, buttonVariants, type ButtonProps } from "./components/button";
export { Input, type InputProps } from "./components/input";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "./components/card";
export {
  Modal,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  type ModalContentProps,
} from "./components/modal";
export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  type DrawerContentProps,
} from "./components/drawer";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./components/table";
export { Toaster, toast } from "./components/toast";
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./components/tooltip";
export { ThemeProvider } from "./components/theme-provider";
export { ThemeToggle } from "./components/theme-toggle";
export { cn } from "./lib/utils";

// Global application shell (layout only — see each component's own comments
// for what's real vs. placeholder).
export { AppShell, type AppShellProps } from "./components/shell/app-shell";
export { TopBar, type TopBarProps } from "./components/shell/top-bar";
export { Sidebar, type SidebarProps } from "./components/shell/sidebar";
export {
  WorkspaceSwitcher,
  type WorkspaceSwitcherProps,
} from "./components/shell/workspace-switcher";
export {
  NotificationButton,
  type NotificationButtonProps,
} from "./components/shell/notification-button";
export { AIButton } from "./components/shell/ai-button";
export { CommandPalette } from "./components/shell/command-palette";
export { MobileNavDrawer, type MobileNavDrawerProps } from "./components/shell/mobile-nav-drawer";
export {
  MobileBottomTabBar,
  type MobileBottomTabBarProps,
} from "./components/shell/mobile-bottom-tab-bar";
export type { NavItem } from "./components/shell/nav-item";

export const UI_COMPONENTS_PACKAGE_VERSION = "0.0.0";
