"use client";

import { Search } from "lucide-react";

export function CommandTrigger() {
  const openCommandPalette = () => {
    window.dispatchEvent(new Event("open-command-palette"));
  };

  return (
    <button
      onClick={openCommandPalette}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground bg-background border border-sidebar-border rounded-lg hover:bg-sidebar-accent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sidebar-ring/50 shadow-sm"
    >
      <Search className="w-4 h-4 shrink-0" />
      <span className="flex-1 text-left truncate">Jump to...</span>
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-sidebar-border bg-sidebar-accent/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}