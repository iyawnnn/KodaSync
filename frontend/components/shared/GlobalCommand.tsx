"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { FileText, MessageSquare, Code2 } from "lucide-react";

export function GlobalCommand() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    const handleCustomEvent = () => setOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener("open-command-palette", handleCustomEvent);

    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-palette", handleCustomEvent);
    };
  }, []);

  // 🚀 ADDED: Smart Routing Logic
  const runCommand = useCallback(
    (action: string) => {
      setOpen(false);
      setTimeout(() => {
        if (pathname === "/dashboard") {
          // If already on the dashboard, trigger the local state switch instantly
          window.dispatchEvent(
            new CustomEvent("dashboard-action", { detail: action }),
          );
        } else {
          // If coming from another page, pass it as a query parameter
          router.push(`/dashboard?action=${action}`);
        }
      }, 150);
    },
    [pathname, router],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem
            disabled={false}
            value="new-chat"
            onSelect={() => runCommand("new-chat")}
            className="cursor-pointer"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>New Chat</span>
          </CommandItem>
          <CommandItem
            disabled={false}
            value="create-note"
            onSelect={() => runCommand("new-note")}
            className="cursor-pointer"
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>Create Note</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Tools">
          <CommandItem
            disabled={false}
            value="open-studio"
            onSelect={() => runCommand("open-studio")}
            className="cursor-pointer"
          >
            <Code2 className="mr-2 h-4 w-4" />
            <span>Open Studio</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
