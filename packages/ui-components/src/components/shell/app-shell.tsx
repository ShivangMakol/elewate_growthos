"use client";

import * as React from "react";

import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MobileBottomTabBar } from "./mobile-bottom-tab-bar";
import { MobileNavDrawer } from "./mobile-nav-drawer";
import type { NavItem } from "./nav-item";

export interface AppShellProps {
  workspaceName: string;
  /** Home / Search / AI Assistant — shown above the divider in the sidebar,
   * and as the primary items in the mobile bottom tab bar. */
  primaryItems: NavItem[];
  /** The per-module items below the divider (CRM, Leads, Pipeline, ...) —
   * desktop sidebar and the mobile nav drawer only, not the bottom tab bar
   * (too many items for that). */
  moduleItems: NavItem[];
  /** Uncontrolled by default (manages its own selection state) so this
   * drops in and "just works" before real routing exists; pass both props
   * to control it once routing lands. */
  activeId?: string | undefined;
  onSelectItem?: ((id: string) => void) | undefined;
  children?: React.ReactNode;
}

/**
 * The global application shell (Architecture Blueprint §5 / UX Spec A.2).
 * Layout only, per this task's explicit scope — no routing, no RBAC-based
 * item filtering, no real search/AI/notifications behavior. Responsive
 * layout is real: desktop shows the collapsible Sidebar + TopBar; below the
 * `md` breakpoint the Sidebar disappears in favor of a hamburger-triggered
 * MobileNavDrawer (inside TopBar) plus a fixed MobileBottomTabBar.
 * (max-lines-per-function is disabled below: TDD 4.2 treats this as a
 * guideline flagged in review, not a hard block — this coordination point
 * wires 5 sub-components + controlled/uncontrolled state, and further
 * fragmenting it would obscure the shell's structure rather than clarify it.)
 */
// eslint-disable-next-line max-lines-per-function
function AppShell({
  workspaceName,
  primaryItems,
  moduleItems,
  activeId: controlledActiveId,
  onSelectItem,
  children,
}: AppShellProps) {
  const [uncontrolledActiveId, setUncontrolledActiveId] = React.useState<string | undefined>(
    primaryItems[0]?.id,
  );
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  const activeId = controlledActiveId ?? uncontrolledActiveId;
  const handleSelectItem = (id: string) => {
    setUncontrolledActiveId(id);
    onSelectItem?.(id);
  };

  return (
    <div data-slot="app-shell" className="flex h-screen w-full overflow-hidden">
      <Sidebar
        workspaceName={workspaceName}
        primaryItems={primaryItems}
        moduleItems={moduleItems}
        activeId={activeId}
        onSelectItem={handleSelectItem}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          workspaceName={workspaceName}
          primaryItems={primaryItems}
          moduleItems={moduleItems}
          activeId={activeId}
          onSelectItem={handleSelectItem}
        />

        <main className="flex-1 overflow-y-auto pb-14 md:pb-0">{children}</main>
      </div>

      <MobileBottomTabBar
        items={primaryItems}
        activeId={activeId}
        onSelectItem={handleSelectItem}
        onMoreClick={() => setMobileDrawerOpen(true)}
      />

      {/* Hidden trigger, controlled by the bottom tab bar's "More" button —
          reuses the same nav-list markup as TopBar's own (uncontrolled,
          hamburger-triggered) MobileNavDrawer instance rather than
          duplicating it a third time. */}
      <MobileNavDrawer
        workspaceName={workspaceName}
        primaryItems={primaryItems}
        moduleItems={moduleItems}
        activeId={activeId}
        onSelectItem={handleSelectItem}
        open={mobileDrawerOpen}
        onOpenChange={setMobileDrawerOpen}
        hideTrigger
      />
    </div>
  );
}

export { AppShell };
