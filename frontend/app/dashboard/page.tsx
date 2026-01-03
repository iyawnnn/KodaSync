"use client";

import { useState } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import NoteLibrary from "@/components/NoteLibrary";
import NoteCreator from "@/components/NoteCreator";
import ChatInterface from "@/components/ChatInterface";

export default function DashboardPage() {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState("library");
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [editingNote, setEditingNote] = useState<any>(null);

  // --- CONTENT SWITCHER ---
  const renderContent = () => {
    switch (activeTab) {
      case "create":
        return (
          <NoteCreator
            initialData={editingNote}
            onSuccess={() => {
              setEditingNote(null); // Clear editing state after save
              setActiveTab("library");
            }}
          />
        );
      case "chat":
        return <ChatInterface sessionId={currentSessionId} />;
      case "library":
      default:
        return (
          <NoteLibrary
            projectId={currentProject?.id} // <--- PASS THE PROJECT ID HERE
            onEdit={(note) => {
              setEditingNote(note);
              setActiveTab("create");
            }}
          />
        );
    }
  };

  // --- HANDLERS ---
  const handleSelectProject = (project: any) => {
    setCurrentProject(project);
    setActiveTab("library");
    // In a real app, you would pass 'project.id' to NoteLibrary to filter the list
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setActiveTab("chat");
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px", // Width of the expanded list rail
        } as React.CSSProperties
      }
    >
      <AppSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectProject={handleSelectProject}
        onSelectSession={handleSelectSession}
      />

      <SidebarInset className="bg-black flex flex-col h-screen overflow-hidden">
        {/* --- TOP HEADER --- */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-4">
          <SidebarTrigger className="-ml-1 text-zinc-400 hover:text-white" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-zinc-800" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <span className="text-zinc-500">KodaSync</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block text-zinc-700" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-zinc-200 font-medium">
                  {/* Dynamic Breadcrumb Title */}
                  {activeTab === "chat"
                    ? "AI Chat"
                    : activeTab === "create"
                    ? editingNote
                      ? "Edit Note"
                      : "Creator Studio"
                    : currentProject
                    ? currentProject.name
                    : "My Library"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* --- MAIN WORKSPACE --- */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto h-full">{renderContent()}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
