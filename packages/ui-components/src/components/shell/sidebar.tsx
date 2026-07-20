"use client";

import * as React from "react";
import { PanelLeftClose, PanelLeft, Settings } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Tooltip, TooltipTrigger, TooltipContent } from "../tooltip";
import type { NavItem } from "./nav-item";

export interface SidebarProps {
  /** Static workspace name/logo shown at the top of the sidebar (UX Spec
   * A.2). The *interactive* switcher control is a separate top-bar
   * component — these are deliberately not the same element, matching the
   * spec's own diagram. */
  workspaceName: string;
  /** Home / Search / AI Assistant — the fixed items above the divider. */
  primaryItems: NavItem[];
  /** The per-module items below the divider (CRM, Leads, Pipeline, ...). */
  moduleItems: NavItem[];
  activeId?: string | undefined;
  /** No-op by default — selecting an item is routing behavior, out of
   * scope for a layout-only shell. */
  onSelectItem?: ((id: string) => void) | undefined;
  className?: string;
}

/**
 * Desktop sidebar only. Mobile navigation reuses this same item data inside
 * a Drawer — see mobile-nav-drawer.tsx — rather than this component trying
 * to also handle the mobile case itself.
 *
 * Collapse/expand is real, working UI state (not a placeholder) — this is
 * layout behavior, one of this task's explicit deliverables ("Responsive
 * Layout"), distinct from the business functionality (routing, RBAC
 * filtering, saved views) this milestone deliberately does not implement.
 * (max-lines-per-function is disabled below: TDD 4.2 treats this as a
 * guideline flagged in review, not a hard block — composes header, two nav
 * sections, and the collapse-toggle footer.)
 */
// eslint-disable-next-line max-lines-per-function
function Sidebar({
  workspaceName,
  primaryItems,
  moduleItems,
  activeId,
  onSelectItem,
  className,
}: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      data-slot="sidebar"
      data-collapsed={collapsed}
      className={cn(
        "group/sidebar bg-background hidden h-full flex-col border-r transition-[width] duration-200 md:flex",
        collapsed ? "w-16 hover:w-56 focus-within:w-56" : "w-56",
        className,
      )}
    >
      <div className="flex h-14 items-center overflow-hidden border-b px-4">
        <span className="truncate text-sm font-semibold whitespace-nowrap">{workspaceName}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto p-2">
        <SidebarSection
          items={primaryItems}
          activeId={activeId}
          onSelectItem={onSelectItem}
          collapsed={collapsed}
        />
        <div className="bg-border my-2 h-px shrink-0" />
        <SidebarSection
          items={moduleItems}
          activeId={activeId}
          onSelectItem={onSelectItem}
          collapsed={collapsed}
        />
      </nav>

      <div className="flex flex-col gap-1 border-t p-2">
        <SidebarButton
          item={{ id: "settings", label: "Settings", icon: Settings }}
          active={activeId === "settings"}
          collapsed={collapsed}
          onClick={() => onSelectItem?.("settings")}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-full justify-start gap-2 px-2"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={collapsed}
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? (
                <PanelLeft className="shrink-0" />
              ) : (
                <PanelLeftClose className="shrink-0" />
              )}
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap",
                  collapsed && "group-hover/sidebar:inline hidden",
                )}
              >
                Collapse
              </span>
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Expand sidebar</TooltipContent>}
        </Tooltip>
      </div>
    </aside>
  );
}

interface SidebarSectionProps {
  items: NavItem[];
  activeId?: string | undefined;
  collapsed: boolean;
  onSelectItem?: ((id: string) => void) | undefined;
}

function SidebarSection({ items, activeId, collapsed, onSelectItem }: SidebarSectionProps) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => (
        <li key={item.id}>
          <SidebarButton
            item={item}
            active={activeId === item.id}
            collapsed={collapsed}
            onClick={() => onSelectItem?.(item.id)}
          />
        </li>
      ))}
    </ul>
  );
}

interface SidebarButtonProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

/** Active item gets a left-border accent in the primary (brand) color, per
 * UX Spec A.2 — the exact white-label theming override point once a tenant
 * sets a custom brand color, since `border-primary` reads from the same
 * `--primary` token every other component does. */
function SidebarButton({ item, active, collapsed, onClick }: SidebarButtonProps) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "text-foreground/80 hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md border-l-2 border-transparent px-2 py-1.5 text-sm font-medium transition-colors",
        active && "border-primary bg-accent text-accent-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span
        className={cn(
          "overflow-hidden whitespace-nowrap",
          collapsed && "group-hover/sidebar:inline hidden",
        )}
      >
        {item.label}
      </span>
    </button>
  );
}

export { Sidebar };
