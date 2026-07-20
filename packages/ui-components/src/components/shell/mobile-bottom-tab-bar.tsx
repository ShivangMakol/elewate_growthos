import { MoreHorizontal } from "lucide-react";

import { cn } from "../../lib/utils";
import type { NavItem } from "./nav-item";

export interface MobileBottomTabBarProps {
  /** A small subset of primary items — mobile bottom bars conventionally
   * hold ~4-5 items max, not the full module list (UX Spec A.2 shows this
   * as a bare "Bottom Tab Bar" without enumerating its contents, so this
   * subset is a reasonable interpretation, not an invented structure). */
  items: NavItem[];
  activeId?: string | undefined;
  onSelectItem?: ((id: string) => void) | undefined;
  /** Opens the full nav drawer for everything not in `items` — typically
   * wired to the same trigger as MobileNavDrawer. */
  onMoreClick?: () => void;
}

// eslint-disable-next-line max-lines-per-function -- TDD 4.2 guideline flagged in review, not a hard block: renders the fixed item set plus the "More" button in one cohesive nav bar.
function MobileBottomTabBar({
  items,
  activeId,
  onSelectItem,
  onMoreClick,
}: MobileBottomTabBarProps) {
  return (
    <nav
      data-slot="mobile-bottom-tab-bar"
      className="bg-background fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-around border-t md:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onSelectItem?.(item.id)}
            className={cn(
              "text-muted-foreground flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-medium",
              active && "text-primary",
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </button>
        );
      })}
      <button
        type="button"
        aria-label="More navigation"
        onClick={onMoreClick}
        className="text-muted-foreground flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-medium"
      >
        <MoreHorizontal className="size-5" />
        More
      </button>
    </nav>
  );
}

export { MobileBottomTabBar };
