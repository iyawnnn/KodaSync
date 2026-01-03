"use client";

import * as React from "react";
import api from "@/lib/api";
import {
  Command,
  Folder,
  Code2,
  MessageSquare,
  Library,
  Plus,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  Edit2,
  Pin,
  PinOff,
} from "lucide-react";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner"; // <--- Import toast

const tools = [
  { title: "My Library", id: "library", icon: Library },
  { title: "Creator Studio", id: "create", icon: Code2 },
  { title: "AI Chat", id: "chat", icon: MessageSquare },
];

export function AppSidebar({
  activeTab,
  setActiveTab,
  onSelectProject,
  onSelectSession,
}: {
  activeTab: string;
  setActiveTab: (val: string) => void;
  onSelectProject: (project: any) => void;
  onSelectSession: (sessionId: string) => void;
}) {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [newItemName, setNewItemName] = React.useState("");

  React.useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === "chat") {
        const res = await api.get("/chat/sessions");
        setSessions(res.data);
      } else {
        const res = await api.get("/projects/");
        setProjects(res.data);
      }
    } catch (e) {
      console.error("Load failed");
    }
  };

  const createItem = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newItemName.trim()) {
      try {
        if (activeTab === "chat") {
          // Manual chat creation usually not needed
        } else {
          const res = await api.post("/projects/", { name: newItemName });
          setProjects([res.data, ...projects]);
          toast.success("Project created");
        }
        setNewItemName("");
      } catch (e) {
        toast.error("Failed to create project");
      }
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await api.post("/chat/sessions", {});
      setSessions([res.data, ...sessions]);
      onSelectSession(res.data.id);
    } catch (e) {
      toast.error("Could not start chat");
    }
  };

  const handlePin = async (e: React.MouseEvent, session: any) => {
    e.stopPropagation();
    try {
      await api.patch(`/chat/sessions/${session.id}`, {
        is_pinned: !session.is_pinned,
      });
      fetchData();
    } catch (e) {
      toast.error("Failed to update session");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    try {
      await api.delete(`/chat/sessions/${id}`);
      setSessions(sessions.filter((s) => s.id !== id));
      toast.success("Conversation deleted");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleRename = async (e: React.MouseEvent, session: any) => {
    e.stopPropagation();
    const newTitle = prompt("Rename conversation:", session.title);
    if (!newTitle) return;
    try {
      await api.patch(`/chat/sessions/${session.id}`, { title: newTitle });
      setSessions(
        sessions.map((s) =>
          s.id === session.id ? { ...s, title: newTitle } : s
        )
      );
      toast.success("Renamed successfully");
    } catch (e) {
      toast.error("Failed to rename");
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row border-r border-zinc-800 bg-black"
    >
      {/* 1. TOOLS RAIL */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r border-zinc-800 bg-zinc-950"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="md:h-8 md:p-0 bg-blue-600 hover:bg-blue-700 text-white justify-center"
              >
                <Command className="size-4" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {tools.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      onClick={() => setActiveTab(item.id)}
                      isActive={activeTab === item.id}
                      className="px-2.5 md:px-2 hover:bg-zinc-800 text-zinc-400 data-[active=true]:text-white data-[active=true]:bg-blue-600/10 justify-center"
                    >
                      <item.icon className="size-5" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={{ name: "User", email: "dev@kodasync.com" }} />
        </SidebarFooter>
      </Sidebar>

      {/* 2. DYNAMIC LIST RAIL */}
      <Sidebar
        collapsible="none"
        className="hidden flex-1 md:flex bg-zinc-950 border-r border-zinc-800"
      >
        <SidebarHeader className="gap-3.5 border-b border-zinc-800 p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-zinc-100 text-base font-medium">
              {activeTab === "chat" ? "Conversations" : "Projects"}
            </div>
            {activeTab === "chat" && (
              <button
                onClick={handleNewChat}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            )}
          </div>
          {activeTab !== "chat" && (
            <div className="relative">
              <SidebarInput
                placeholder="New Project..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={createItem}
                className="bg-zinc-900 border-zinc-800 text-zinc-200 focus:border-blue-600 pl-8"
              />
              <Plus className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            </div>
          )}
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {activeTab === "chat"
                ? // CHAT SESSIONS LIST (Updated with Menu)
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="group flex items-center w-full hover:bg-zinc-900 border-b border-zinc-800/50 transition-colors"
                    >
                      <button
                        onClick={() => onSelectSession(session.id)}
                        className="flex-1 text-left flex items-center gap-2 p-4 text-sm min-w-0"
                      >
                        <MessageCircle
                          className={`size-4 shrink-0 ${
                            session.is_pinned
                              ? "text-yellow-500 fill-yellow-500/10"
                              : "text-green-500"
                          }`}
                        />
                        <span
                          className={`font-medium truncate ${
                            session.is_pinned
                              ? "text-yellow-100"
                              : "text-zinc-300"
                          }`}
                        >
                          {session.title}
                        </span>
                      </button>

                      {/* THREE DOTS MENU */}
                      <div className="pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-300">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            className="bg-zinc-900 border-zinc-800 text-zinc-200"
                            align="end"
                          >
                            <DropdownMenuItem
                              onClick={(e) => handleRename(e, session)}
                              className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handlePin(e, session)}
                              className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
                            >
                              {session.is_pinned ? (
                                <PinOff className="w-3.5 h-3.5 mr-2" />
                              ) : (
                                <Pin className="w-3.5 h-3.5 mr-2" />
                              )}
                              {session.is_pinned ? "Unpin" : "Pin"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem
                              onClick={(e) => handleDelete(e, session.id)}
                              className="text-red-400 cursor-pointer hover:bg-red-900/20 focus:bg-red-900/20 hover:text-red-300 focus:text-red-300"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                : // PROJECTS LIST
                  projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => onSelectProject(proj)}
                      className="w-full text-left flex flex-col gap-1 border-b border-zinc-800/50 p-4 hover:bg-zinc-900 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-zinc-200">
                        <Folder className="size-4 text-blue-500" />
                        <span className="font-medium truncate">
                          {proj.name}
                        </span>
                      </div>
                    </button>
                  ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
