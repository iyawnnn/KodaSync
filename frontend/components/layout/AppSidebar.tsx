"use client";

import * as React from "react";
import api from "@/lib/api";
import {
  Bot,
  PenLine,
  History,
  Plus,
  MessageCircle,
  MoreVertical,
  Folder,
  Trash2,
  Edit2,
  Pin,
  PinOff,
  FileCode,
  Copy,
  Loader2,
  AlertTriangle,
  Layers,
  Search,
} from "lucide-react";
import { NavUser } from "@/components/layout/NavUser";
import { CommandTrigger } from "@/components/shared/CommandTrigger";
import { Sidebar, useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Image from "next/image";

const ICON_STROKE = 2.25;

const formatLabel = (s: string) => {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

export function AppSidebar({
  activeTab,
  setActiveTab,
  onSelectProject,
  onSelectSession,
  onSelectNote,
  currentSessionId,
  currentProjectId,
}: {
  activeTab: string;
  setActiveTab: (val: string) => void;
  onSelectProject: (project: any) => void;
  onSelectSession: (sessionId: string | null, title?: string) => void;
  onSelectNote?: (note: any) => void;
  currentSessionId?: string | null;
  currentProjectId?: string | null;
}) {
  const { state } = useSidebar();
  const [projects, setProjects] = React.useState<any[]>([]);
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [notes, setNotes] = React.useState<any[]>([]);
  const [newItemName, setNewItemName] = React.useState("");
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const [renameItem, setRenameItem] = React.useState<{
    id: string;
    type: "session" | "project" | "note";
    currentName: string;
  } | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [renameLoading, setRenameLoading] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    type: "session" | "project" | "note";
    name: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  React.useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === "chat") {
        const res = await api.get("/chat/sessions");
        setSessions(res.data);
      } else if (activeTab === "create") {
        const res = await api.get("/notes/");
        setNotes(res.data);
      } else {
        const res = await api.get("/projects/");
        setProjects(res.data);
      }
    } catch (e) {}
  };

  const handleCreateProject = async () => {
    if (!newItemName.trim()) return;
    try {
      const res = await api.post("/projects/", { name: newItemName });
      setProjects([res.data, ...projects]);
      toast.success("Project created");
      setNewItemName("");
      setIsPopoverOpen(false);
    } catch (e) {
      toast.error("Failed to create");
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await api.post("/chat/sessions", {});
      setSessions([res.data, ...sessions]);
      onSelectSession(res.data.id, res.data.title);
    } catch (e) {
      toast.error("Error starting chat");
    }
  };

  const confirmDelete = (
    e: React.MouseEvent,
    item: any,
    type: "session" | "project" | "note",
  ) => {
    e.stopPropagation();
    setDeleteItem({
      id: item.id,
      type,
      name: item.title || item.name || "Untitled Item",
    });
  };

  const executeDelete = async () => {
    if (!deleteItem) return;
    setDeleteLoading(true);
    const { id, type } = deleteItem;

    try {
      if (type === "session") {
        await api.delete(`/chat/sessions/${id}`);
        setSessions(sessions.filter((s) => s.id !== id));
        if (currentSessionId === id) onSelectSession(null);
      } else if (type === "project") {
        await api.delete(`/projects/${id}`);
        setProjects(projects.filter((p) => p.id !== id));
        if (currentProjectId === id) onSelectProject(null);
      } else if (type === "note") {
        await api.delete(`/notes/${id}`);
        setNotes(notes.filter((n) => n.id !== id));
      }
      toast.success("Deleted successfully");
      setDeleteItem(null);
    } catch (e) {
      toast.error("Failed to delete");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openRenameDialog = (
    e: React.MouseEvent,
    item: any,
    type: "session" | "project" | "note",
  ) => {
    e.stopPropagation();
    setRenameItem({ id: item.id, type, currentName: item.title || item.name });
    setRenameValue(item.title || item.name);
  };

  const executeRename = async () => {
    if (!renameItem || !renameValue.trim()) return;
    setRenameLoading(true);
    const { id, type } = renameItem;
    const newName = renameValue;

    try {
      if (type === "session") {
        await api.patch(`/chat/sessions/${id}`, { title: newName });
        setSessions(
          sessions.map((s) => (s.id === id ? { ...s, title: newName } : s)),
        );
        if (currentSessionId === id) onSelectSession(id, newName);
      } else if (type === "project") {
        await api.patch(`/projects/${id}`, { name: newName });
        setProjects(
          projects.map((p) => (p.id === id ? { ...p, name: newName } : p)),
        );
      } else if (type === "note") {
        await api.put(`/notes/${id}`, { title: newName });
        setNotes(
          notes.map((n) => (n.id === id ? { ...n, title: newName } : n)),
        );
      }
      toast.success("Renamed successfully");
      setRenameItem(null);
    } catch (e) {
      toast.error("Failed to rename");
    } finally {
      setRenameLoading(false);
    }
  };

  const handlePin = async (
    e: React.MouseEvent,
    item: any,
    type: "session" | "project",
  ) => {
    e.stopPropagation();
    try {
      const newStatus = !item.is_pinned;
      if (type === "session") {
        setSessions(
          sessions.map((s) =>
            s.id === item.id ? { ...s, is_pinned: newStatus } : s,
          ),
        );
        await api.patch(`/chat/sessions/${item.id}`, { is_pinned: newStatus });
      } else if (type === "project") {
        setProjects(
          projects.map((p) =>
            p.id === item.id ? { ...p, is_pinned: newStatus } : p,
          ),
        );
        await api.patch(`/projects/${item.id}`, { is_pinned: newStatus });
      }
    } catch (e) {
      toast.error("Failed to pin");
    }
  };

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success("Code copied");
  };

  const triggerSearch = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true })
    );
  };

  const renderContextualList = () => {
    if (activeTab === "chat") {
      if (sessions.length === 0)
        return <EmptyState icon={MessageCircle} label="No recent chats" />;
      return sessions.map((s) => (
        <SidebarItem
          key={s.id}
          icon={s.is_pinned ? Pin : MessageCircle}
          label={s.title || "Untitled Chat"}
          subLabel={new Date(s.updated_at || Date.now()).toLocaleDateString(
            undefined,
            { month: "short", day: "numeric" },
          )}
          isActive={s.id === currentSessionId}
          isPinned={s.is_pinned}
          onClick={() => onSelectSession(s.id, s.title)}
          actions={
            <>
              <DropdownMenuItem onClick={(e) => openRenameDialog(e, s, "session")}>
                <Edit2 className="mr-2 size-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handlePin(e, s, "session")}>
                {s.is_pinned ? <PinOff className="mr-2 size-3.5" /> : <Pin className="mr-2 size-3.5" />}
                {s.is_pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem onClick={(e) => confirmDelete(e, s, "session")} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 size-3.5" />
                Delete
              </DropdownMenuItem>
            </>
          }
        />
      ));
    }

    if (activeTab === "create") {
      if (notes.length === 0)
        return <EmptyState icon={FileCode} label="No notes created yet" />;
      return notes.map((n) => (
        <SidebarItem
          key={n.id}
          icon={n.is_pinned ? Pin : FileCode}
          label={n.title || "Untitled Note"}
          subLabel={formatLabel(n.language)}
          isPinned={n.is_pinned}
          onClick={() => onSelectNote && onSelectNote(n)}
          actions={
            <>
              <DropdownMenuItem onClick={(e) => handleCopyCode(e, n.code_snippet)}>
                <Copy className="mr-2 size-3.5" />
                Copy Code
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => openRenameDialog(e, n, "note")}>
                <Edit2 className="mr-2 size-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem onClick={(e) => confirmDelete(e, n, "note")} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 size-3.5" />
                Delete
              </DropdownMenuItem>
            </>
          }
        />
      ));
    }

    return (
      <div className="flex flex-col gap-1">
        <SidebarItem
          icon={Layers}
          label="All Notes"
          subLabel="Global"
          isActive={currentProjectId === null}
          onClick={() => onSelectProject(null)}
        />

        {projects.length > 0 ? (
          projects.map((p) => (
            <SidebarItem
              key={p.id}
              icon={p.is_pinned ? Pin : Folder}
              label={p.name}
              isActive={p.id === currentProjectId}
              isPinned={p.is_pinned}
              onClick={() => onSelectProject(p)}
              actions={
                <>
                  <DropdownMenuItem onClick={(e) => openRenameDialog(e, p, "project")}>
                    <Edit2 className="mr-2 size-3.5" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handlePin(e, p, "project")}>
                    {p.is_pinned ? <PinOff className="mr-2 size-3.5" /> : <Pin className="mr-2 size-3.5" />}
                    {p.is_pinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem onClick={(e) => confirmDelete(e, p, "project")} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 size-3.5" />
                    Delete
                  </DropdownMenuItem>
                </>
              }
            />
          ))
        ) : (
          <div className="pt-4">
            <EmptyState icon={Folder} label="No projects found" />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="border-r-0 bg-sidebar font-sans text-sidebar-foreground"
        data-testid="app-sidebar"
      >
        <TooltipProvider delayDuration={0}>
          <div className="flex flex-col h-full w-full overflow-hidden">
            
            {/* HEADER SECTION - FIXED TOP PADDING & SEARCH VISIBILITY */}
            <div className="flex-none pt-8 pb-4 px-4 z-10 transition-all group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pt-8 group-data-[collapsible=icon]:pb-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col">
              
              {/* Raw Static Logo & Name */}
              <div className="flex items-center gap-3 mb-6 px-1 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mb-4">
                <Image
                  src="/logo.png"
                  alt="KodaSync Logo"
                  width={28}
                  height={28}
                  className="shrink-0"
                />
                <span className="text-lg font-bold tracking-tight text-sidebar-foreground leading-none group-data-[collapsible=icon]:hidden">
                  KodaSync
                </span>
              </div>

              {/* Unified Search - Expanded State */}
              <div className="group-data-[collapsible=icon]:hidden w-full">
                <CommandTrigger />
              </div>

              {/* Unified Search - Collapsed State */}
              <div className="hidden group-data-[collapsible=icon]:flex w-full justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={triggerSearch}
                      className="flex items-center justify-center size-10 rounded-full transition-all duration-200 border border-transparent text-muted-foreground hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                    >
                      <Search className="size-[18px] shrink-0 transition-colors" strokeWidth={ICON_STROKE} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Search</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* MAIN NAVIGATION */}
            <div className="flex-none px-3 py-2 space-y-1 transition-all duration-200 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
               <MainNavItem 
                 icon={Bot} 
                 label="Ask Assistant" 
                 isActive={activeTab === "chat"} 
                 onClick={() => setActiveTab("chat")} 
               />
               <MainNavItem 
                 icon={PenLine} 
                 label="Studio Editor" 
                 isActive={activeTab === "create"} 
                 onClick={() => setActiveTab("create")} 
               />
               <MainNavItem 
                 icon={History} 
                 label="Library & History" 
                 isActive={activeTab === "library"} 
                 onClick={() => setActiveTab("library")} 
               />
            </div>

            {/* CONTEXTUAL LIST */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 sidebar-scrollbar group-data-[collapsible=icon]:hidden">
              
              {/* Section Header with integrated Add Action */}
              <div className="group flex items-center justify-between px-3 mb-2 mt-4">
                <span className="text-[12px] font-bold text-sidebar-foreground/60 tracking-wide">
                  {activeTab === "chat" ? "Recent" : activeTab === "create" ? "Notes" : "Projects"}
                </span>
                
                {/* Contextual Action Button */}
                {activeTab === "chat" ? (
                  <button onClick={handleNewChat} className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-1">
                     <Plus className="size-4" strokeWidth={2.5} />
                  </button>
                ) : activeTab === "create" ? (
                  <button onClick={() => onSelectNote && onSelectNote(null)} className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-1">
                     <Plus className="size-4" strokeWidth={2.5} />
                  </button>
                ) : (
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-1">
                        <Plus className="size-4" strokeWidth={2.5} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="start" sideOffset={4}>
                      <div className="flex gap-2">
                        <Input
                          autoFocus
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                          className="h-8 text-xs font-medium"
                          placeholder="Project name..."
                        />
                        <Button size="sm" onClick={handleCreateProject} className="h-8 px-2 bg-primary text-primary-foreground">
                          Save
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {renderContextualList()}
            </div>

            {/* FOOTER - ONLY NAVUSER */}
            <div className="flex-none p-4 mt-auto bg-sidebar/50 flex items-center justify-center group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:justify-center">
              <NavUser />
            </div>

          </div>
        </TooltipProvider>
      </Sidebar>

      {/* RENAME MODAL */}
      <Dialog open={!!renameItem} onOpenChange={(open) => !open && setRenameItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Rename {renameItem?.type === "note" ? "Note" : renameItem?.type === "project" ? "Project" : "Chat"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Enter new name..."
              onKeyDown={(e) => e.key === "Enter" && executeRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameItem(null)}>Cancel</Button>
            <Button onClick={executeRename} disabled={renameLoading}>
              {renameLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden border-destructive/20 shadow-2xl">
          <div className="bg-destructive/10 p-6 flex flex-col items-center justify-center border-b border-destructive/10">
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-destructive text-lg font-bold">Delete Item?</DialogTitle>
            <DialogDescription className="text-center text-destructive/80 mt-1 max-w-[280px]">
              You are about to permanently delete <br />
              <span className="font-bold text-foreground">"{deleteItem?.name}"</span>
            </DialogDescription>
          </div>
          <div className="p-6 bg-background">
            <div className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
              This action <span className="font-bold text-foreground">cannot be undone</span>. All data associated with this {deleteItem?.type} will be removed from our servers forever.
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteItem(null)} className="flex-1">Cancel</Button>
              <Button variant="destructive" onClick={executeDelete} disabled={deleteLoading} className="flex-1 bg-destructive hover:bg-destructive/90">
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete Forever
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- SUB-COMPONENTS ---

const MainNavItem = ({ icon: Icon, label, isActive, onClick }: any) => {
  const { state } = useSidebar();
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-full font-semibold text-[14px] transition-all duration-200 border border-transparent",
            "group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0",
            isActive 
              ? "bg-sidebar-accent text-primary" 
              : "text-muted-foreground hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
          )}
        >
          <Icon 
            className={cn("size-[18px] shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} 
            strokeWidth={ICON_STROKE} 
          />
          <span className="group-data-[collapsible=icon]:hidden">
            {label}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" hidden={state !== "collapsed"}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
};

const SidebarItem = ({ icon: Icon, label, subLabel, isActive, isPinned, onClick, actions }: any) => (
  <div
    onClick={onClick}
    className={cn(
      "group relative flex items-center gap-3 px-4 py-2.5 rounded-full cursor-pointer transition-all duration-200 overflow-hidden border border-transparent",
      isActive ? "bg-sidebar-accent/80" : "hover:bg-sidebar-accent/30"
    )}
  >
    {isPinned ? (
      <Pin
        className={cn("size-[18px] shrink-0 transition-colors", isActive ? "text-primary fill-primary/20" : "text-muted-foreground")}
        strokeWidth={ICON_STROKE}
      />
    ) : (
      <Icon
        className={cn("size-[18px] shrink-0 transition-colors", isActive ? "text-sidebar-foreground" : "text-muted-foreground group-hover:text-sidebar-foreground")}
        strokeWidth={ICON_STROKE}
      />
    )}
    
    <div className="flex flex-col min-w-0 flex-1 gap-0 pr-6">
      <span className={cn("text-[14px] font-semibold truncate transition-colors", isActive ? "text-sidebar-foreground" : "text-muted-foreground group-hover:text-sidebar-foreground", isPinned && "font-bold")}>
        {label}
      </span>
      {subLabel && (
        <span className="text-[12px] font-medium text-muted-foreground/60 truncate capitalize">{subLabel}</span>
      )}
    </div>

    {actions && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              onClick={(e) => e.stopPropagation()}
              variant="ghost"
              className="h-7 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity hover:bg-sidebar-background hover:text-sidebar-foreground"
            >
              <MoreVertical className="size-4 text-muted-foreground" strokeWidth={ICON_STROKE} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 font-medium p-1.5 shadow-xl border-sidebar-border bg-popover text-popover-foreground rounded-xl">
            {actions}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )}
  </div>
);

const EmptyState = ({ icon: Icon, label }: any) => (
  <div className="flex flex-col items-center justify-center py-10 px-4 text-center opacity-60">
    <Icon className="size-6 text-muted-foreground mb-3" strokeWidth={1.5} />
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
  </div>
);