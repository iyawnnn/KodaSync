"use client";

import { useState, useEffect } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar"; 
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import NoteLibrary from "@/components/notes/NoteLibrary"; 
import StudioCreator from "@/components/notes/StudioCreator"; 
import ChatInterface from "@/components/chat/ChatInterface"; 

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("chat");
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentSessionTitle, setCurrentSessionTitle] = useState<string>("New Chat");
  const [editingNote, setEditingNote] = useState<any>(null);

  // 🚀 FIXED: Handle object payloads and missing open-chat/open-note cases
  useEffect(() => {
    const handleDashboardAction = async (e: any) => {
      // Support both new object payload and legacy string payload
      const payload = e.detail;
      const action = typeof payload === "string" ? payload : payload?.action;
      const id = payload?.id;

      if (action === "new-chat") {
        setActiveTab("chat");
        setCurrentSessionId(null);
        setCurrentSessionTitle("New Chat");
      } else if (action === "new-note" || action === "open-studio") {
        setActiveTab("create");
        setEditingNote(null);
      } else if (action === "open-chat" && id) {
        setActiveTab("chat");
        setCurrentSessionId(id);
        setCurrentSessionTitle("AI Chat");
      } else if (action === "open-note" && id) {
        try {
          // Fetch notes dynamically to get the full note object for the Studio Editor
          const api = (await import("@/lib/api")).default;
          const res = await api.get("/notes/");
          const targetNote = res.data.find((n: any) => n.id === id);
          if (targetNote) {
            setEditingNote(targetNote);
            setActiveTab("create");
          }
        } catch (err) {
          console.error("Failed to load note from Command Palette:", err);
        }
      }
    };

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const action = params.get("action");
      const id = params.get("id");
      
      if (action) {
        handleDashboardAction({ detail: { action, id } });
        // Clean the URL so it doesn't trigger again on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      window.addEventListener("dashboard-action", handleDashboardAction);
      return () => window.removeEventListener("dashboard-action", handleDashboardAction);
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "create":
        return (
          <div className="h-full p-2 md:p-6">
            <StudioCreator
              initialData={editingNote}
              onSuccess={() => {}}
              currentProjectId={currentProject?.id}
            />
          </div>
        );
      case "chat":
        return (
          <div className="h-full p-2 md:p-6">
            <ChatInterface sessionId={currentSessionId || undefined} />
          </div>
        );
      case "library":
      default:
        return (
          <NoteLibrary
            projectId={currentProject?.id}
            onEdit={(note) => {
              setEditingNote(note);
              setActiveTab("create");
            }}
          />
        );
    }
  };

  const handleSelectProject = (project: any) => {
    setCurrentProject(project);
    setActiveTab("library");
  };

  const handleSelectSession = (sessionId: string | null, title?: string) => {
    setCurrentSessionId(sessionId);
    if (title) setCurrentSessionTitle(title);
    if (sessionId === null) setCurrentSessionTitle("New Chat");
    setActiveTab("chat");
  };

  const handleSelectNote = (note: any) => {
    setEditingNote(note);
    setActiveTab("create");
  };

  const getRootTitle = () => {
    switch (activeTab) {
        case "chat": return "AI Chat";
        case "create": return "Studio";
        default: return "Library";
    }
  }

  const getBreadcrumbTitle = () => {
    if (activeTab === "chat") return currentSessionTitle;
    if (activeTab === "create") return editingNote ? editingNote.title : "New Document";
    if (activeTab === "library") return currentProject ? currentProject.name : "All Notes";
    return "Dashboard";
  };

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "18rem" } as React.CSSProperties}
    >
      <AppSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectProject={handleSelectProject}
        onSelectSession={handleSelectSession}
        onSelectNote={handleSelectNote}
        currentSessionId={currentSessionId}
        currentProjectId={currentProject?.id || null}
      />

      <SidebarInset className="bg-background flex flex-col h-screen overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-border" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <span className="font-bold text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {getRootTitle()}
                </span>
              </BreadcrumbItem>
              
              <BreadcrumbSeparator className="hidden md:block text-muted-foreground" />
              
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-sm text-foreground capitalize">
                  {getBreadcrumbTitle()}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div
          className={`flex-1 main-scrollbar ${
            activeTab === "chat" || activeTab === "create"
              ? "overflow-hidden"
              : "overflow-y-auto scroll-smooth"
          }`}
        >
          <div className="max-w-7xl mx-auto h-full">{renderContent()}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}