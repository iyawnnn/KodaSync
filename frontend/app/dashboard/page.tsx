"use client";

import { useState } from "react";
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
import NoteCreator from "@/components/notes/NoteCreator"; 
import ChatInterface from "@/components/chat/ChatInterface"; 

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("library");
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [editingNote, setEditingNote] = useState<any>(null);

  const renderContent = () => {
    switch (activeTab) {
      case "create":
        return (
          <NoteCreator
            initialData={editingNote}
            onSuccess={() => {
              setEditingNote(null);
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

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setActiveTab("chat");
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
      />

      <SidebarInset className="bg-background flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-border" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <span className="font-bold text-sm text-muted-foreground hover:text-foreground transition-colors">
                  KodaSync
                </span>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block text-muted-foreground" />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-sm text-foreground">
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

        {/* Content Area */}
        <div
          className={`flex-1 p-6 ${
            activeTab === "chat"
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