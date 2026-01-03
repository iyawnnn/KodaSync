"use client";

import * as React from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  Command,
  Folder,
  Code2,
  MessageSquare,
  Library,
  Plus,
  MessageCircle,
} from "lucide-react";
import { NavUser } from "@/components/nav-user";
import { Label } from "@/components/ui/label";
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
  }, [activeTab]); // Refetch when tab changes

  const fetchData = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      if (activeTab === "chat") {
        const res = await axios.get("http://localhost:8000/chat/sessions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSessions(res.data);
      } else {
        const res = await axios.get("http://localhost:8000/projects/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(res.data);
      }
    } catch (e) {
      console.error("Load failed");
    }
  };

  const createItem = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newItemName.trim()) {
      const token = Cookies.get("token");
      try {
        if (activeTab === "chat") {
          // Creating a chat session usually happens automatically, but we can support manual creation or just search
          // For now, let's keep it simple: Use the button below to start new chat
        } else {
          const res = await axios.post(
            "http://localhost:8000/projects/",
            { name: newItemName },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setProjects([res.data, ...projects]);
        }
        setNewItemName("");
      } catch (e) {
        alert("Failed");
      }
    }
  };

  const handleNewChat = async () => {
    const token = Cookies.get("token");
    try {
      const res = await axios.post(
        "http://localhost:8000/chat/sessions",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions([res.data, ...sessions]);
      onSelectSession(res.data.id);
    } catch (e) {
      alert("Could not start chat");
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
                ? // CHAT SESSIONS LIST
                  sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className="w-full text-left flex items-center gap-2 border-b border-zinc-800/50 p-4 text-sm hover:bg-zinc-900 transition-colors"
                    >
                      <MessageCircle className="size-4 text-green-500 shrink-0" />
                      <span className="font-medium truncate text-zinc-300">
                        {session.title}
                      </span>
                    </button>
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
