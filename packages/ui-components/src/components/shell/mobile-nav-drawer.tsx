"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { Button } from "../button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "../drawer";
import type { NavItem } from "./nav-item";

export interface MobileNavDrawerProps {
  workspaceName: string;
  primaryItems: NavItem[];
  moduleItems: NavItem[];
  activeId?: string | undefined;
  onSelectItem?: ((id: string) => void) | undefined;
  /** Optional external control (e.g. a second trigger elsewhere, like the
   * bottom tab bar's "More" button, opening this same drawer). Falls back
   * to internal state when not provided. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hides this component's own trigger button — used when something else
   * (the bottom tab bar's "More" button) is the only trigger, so the
   * hamburger button doesn't render twice. */
  hideTrigger?: boolean;
}

/**
 * Reuses the design system's existing Drawer rather than building a second,
 * mobile-specific nav implementation. `side="left"` overrides Drawer's
 * default `right` — that default is for object-detail drawers (Contacts,
 * Leads); a primary-navigation drawer conventionally opens from the same
 * side the desktop sidebar visually occupies.
 * (max-lines-per-function is disabled below: TDD 4.2 treats this as a
 * guideline flagged in review, not a hard block — controlled/uncontrolled
 * dual-mode state plus the nav-list render.)
 */
// eslint-disable-next-line max-lines-per-function
function MobileNavDrawer({
  workspaceName,
  primaryItems,
  moduleItems,
  activeId,
  onSelectItem,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  hideTrigger = false,
}: MobileNavDrawerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const handleSelect = (id: string) => {
    onSelectItem?.(id);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open navigation" className="md:hidden">
            <Menu />
          </Button>
        </DrawerTrigger>
      )}
      <DrawerContent side="left" className="w-64 max-w-[80vw]">
        <DrawerHeader>
          <DrawerTitle>{workspaceName}</DrawerTitle>
          <DrawerDescription className="sr-only">Navigation</DrawerDescription>
        </DrawerHeader>
        <nav className="flex flex-col gap-1 overflow-y-auto">
          {[...primaryItems, ...moduleItems].map((item) => {
            const Icon = item.icon;
            const active = activeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => handleSelect(item.id)}
                className={
                  "text-foreground/80 hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md border-l-2 border-transparent px-2 py-2 text-sm font-medium transition-colors" +
                  (active ? " border-primary bg-accent text-accent-foreground" : "")
                }
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </DrawerContent>
    </Drawer>
  );
}

export { MobileNavDrawer };
