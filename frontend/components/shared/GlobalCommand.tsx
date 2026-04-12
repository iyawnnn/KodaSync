"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";
import { AxiosError } from "axios";
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

interface SearchItem {
  id: string;
  title: string;
}

export function GlobalCommand() {
  const [open, setOpen] = useState(false);
  const [chats, setChats] = useState<SearchItem[]>([]);
  const [notes, setNotes] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
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

  useEffect(() => {
    if (!open) return;

    const fetchSpotlightData = async () => {
      setIsLoading(true);
      try {
        const [chatsRes, notesRes] = await Promise.allSettled([
          api.get("/chat/sessions"), 
          api.get("/notes/"),        
        ]);

        if (chatsRes.status === "fulfilled" && chatsRes.value.data) {
          setChats(chatsRes.value.data);
        } else if (chatsRes.status === "rejected") {
          const error = chatsRes.reason as AxiosError;
          console.error("Chats fetch failed:", error.response?.status, error.message);
        }
        
        if (notesRes.status === "fulfilled" && notesRes.value.data) {
          setNotes(notesRes.value.data);
        } else if (notesRes.status === "rejected") {
          const error = notesRes.reason as AxiosError;
          console.error("Notes fetch failed:", error.response?.status, error.message);
        }
      } catch (error) {
        console.error("Unexpected error during spotlight fetch:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpotlightData();
  }, [open]);

  const runCommand = useCallback(
    (action: string, id?: string) => {
      setOpen(false);
      
      setTimeout(() => {
        if (pathname === "/dashboard") {
          window.dispatchEvent(
            new CustomEvent("dashboard-action", { 
              detail: { action, id } 
            }),
          );
        } else {
          const queryParams = new URLSearchParams({ action });
          if (id) {
            queryParams.append("id", id);
          }
          router.push(`/dashboard?${queryParams.toString()}`);
        }
      }, 150);
    },
    [pathname, router],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>
          {isLoading ? "Loading data..." : "No results found."}
        </CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem 
            value="new chat create"
            onSelect={() => runCommand("new-chat")}
            className="!p-0 aria-disabled:opacity-100 data-[disabled=true]:opacity-100"
          >
            <div 
              className="flex w-full items-center gap-2 px-2 py-1.5 cursor-pointer pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                runCommand("new-chat");
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span>New Chat</span>
            </div>
          </CommandItem>
          
          <CommandItem 
            value="create new note"
            onSelect={() => runCommand("new-note")}
            className="!p-0 aria-disabled:opacity-100 data-[disabled=true]:opacity-100"
          >
            <div 
              className="flex w-full items-center gap-2 px-2 py-1.5 cursor-pointer pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                runCommand("new-note");
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span>Create Note</span>
            </div>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {chats.length > 0 && (
          <CommandGroup heading="Recent Chats">
            {chats.map((chat) => (
              <CommandItem 
                key={chat.id} 
                // Injecting the title into the value makes it fully searchable by the user
                value={`chat ${chat.title} ${chat.id}`} 
                onSelect={() => runCommand("open-chat", chat.id)}
                className="!p-0 aria-disabled:opacity-100 data-[disabled=true]:opacity-100"
              >
                <div 
                  className="flex w-full items-center gap-2 px-2 py-1.5 cursor-pointer pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    runCommand("open-chat", chat.id);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {notes.length > 0 && (
          <CommandGroup heading="Recent Notes">
            {notes.map((note) => (
              <CommandItem 
                key={note.id} 
                // Injecting the title into the value makes it fully searchable by the user
                value={`note ${note.title} ${note.id}`}
                onSelect={() => runCommand("open-note", note.id)}
                className="!p-0 aria-disabled:opacity-100 data-[disabled=true]:opacity-100"
              >
                <div 
                  className="flex w-full items-center gap-2 px-2 py-1.5 cursor-pointer pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    runCommand("open-note", note.id);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">{note.title}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Tools">
          <CommandItem 
            value="open studio editor tool"
            onSelect={() => runCommand("open-studio")}
            className="!p-0 aria-disabled:opacity-100 data-[disabled=true]:opacity-100"
          >
            <div 
              className="flex w-full items-center gap-2 px-2 py-1.5 cursor-pointer pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                runCommand("open-studio");
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Code2 className="h-4 w-4 shrink-0" />
              <span>Open Studio</span>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}