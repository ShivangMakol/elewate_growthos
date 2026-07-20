"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from "../modal";
import { Input } from "../input";
import { Button } from "../button";

/**
 * Layout placeholder only. Opens on Cmd+K / Ctrl+K, or by clicking the
 * search-styled trigger button this component also renders (UX Spec A.2's
 * top-bar "[Global Search/Cmd+K]" slot) — but the search input performs no
 * actual fuzzy search, and there are no real action commands (UX Spec A.3);
 * both are business logic for a later milestone. What's real here: the
 * keyboard shortcut listener and the open/close state, since that's genuine
 * shell/layout behavior, not a feature. Self-contained (trigger + dialog
 * together) rather than split across TopBar, so there's no state to prop-
 * drill for what is otherwise a pure layout piece.
 * (max-lines-per-function is disabled below: TDD 4.2 treats this as a
 * guideline flagged in review, not a hard block — self-contained by design,
 * see above.)
 */
// eslint-disable-next-line max-lines-per-function
function CommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="text-muted-foreground w-full max-w-sm justify-between gap-2 px-3 font-normal sm:w-64"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-2">
          <Search className="size-4 shrink-0" />
          Search...
        </span>
        <kbd className="bg-muted text-muted-foreground pointer-events-none hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
          &#8984;K
        </kbd>
      </Button>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent className="top-[20%] max-w-xl translate-y-0 gap-0 p-0">
          <ModalHeader className="sr-only">
            <ModalTitle>Command Palette</ModalTitle>
            <ModalDescription>Search or run a command.</ModalDescription>
          </ModalHeader>
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="text-muted-foreground size-4 shrink-0" />
            <Input
              placeholder="Search or run a command..."
              className="h-12 border-0 shadow-none focus-visible:ring-0"
              disabled
            />
          </div>
          <div className="text-muted-foreground p-6 text-center text-sm">
            Search and commands aren&apos;t wired up yet — this is the shell only.
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}

export { CommandPalette };
