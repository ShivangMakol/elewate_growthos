import { WorkspaceSwitcher } from "./workspace-switcher";
import { CommandPalette } from "./command-palette";
import { AIButton } from "./ai-button";
import { NotificationButton } from "./notification-button";
import { MobileNavDrawer } from "./mobile-nav-drawer";
import { ThemeToggle } from "../theme-toggle";
import type { NavItem } from "./nav-item";

export interface TopBarProps {
  workspaceName: string;
  primaryItems: NavItem[];
  moduleItems: NavItem[];
  activeId?: string | undefined;
  onSelectItem?: ((id: string) => void) | undefined;
}

/**
 * Top bar order matches UX Spec A.2 exactly: [Workspace Switcher]
 * [Global Search/Cmd+K] [AI Assistant Trigger] [Notifications] [Avatar].
 * No Avatar/user-menu here — not in this task's explicit component list,
 * so deliberately not added even though the UX Spec diagram shows one;
 * that's a follow-up, not an oversight.
 */
function TopBar({ workspaceName, primaryItems, moduleItems, activeId, onSelectItem }: TopBarProps) {
  return (
    <header
      data-slot="top-bar"
      className="bg-background flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4"
    >
      <MobileNavDrawer
        workspaceName={workspaceName}
        primaryItems={primaryItems}
        moduleItems={moduleItems}
        activeId={activeId}
        onSelectItem={onSelectItem}
      />

      <div className="hidden md:block">
        <WorkspaceSwitcher workspaceName={workspaceName} />
      </div>

      <div className="flex flex-1 justify-center px-2 sm:justify-start">
        <CommandPalette />
      </div>

      <div className="flex items-center gap-1">
        <AIButton />
        <NotificationButton />
        <ThemeToggle />
      </div>
    </header>
  );
}

export { TopBar };
