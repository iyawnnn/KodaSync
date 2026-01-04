"use client";

import * as React from "react";
import api from "@/lib/api";
import {
  Code2,
  MessageSquare,
  Library,
  Plus,
  MessageCircle,
  Search,
  MoreHorizontal,
  Folder,
  Trash2,
  Edit2,
  Pin,
  PinOff,
  Command,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { NavUser } from "@/components/layout/NavUser";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ICON_STROKE = 1.5;

const TABS = [
  { id: "library", label: "Library", icon: Library },
  { id: "create", label: "Studio", icon: Code2 },
  { id: "chat", label: "Chat", icon: MessageSquare },
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
  const { state } = useSidebar();
  const [projects, setProjects] = React.useState<any[]>([]);
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [newProjectName, setNewProjectName] = React.useState("");
  const [isProjectPopoverOpen, setIsProjectPopoverOpen] = React.useState(false);

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

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await api.post("/projects/", { name: newProjectName });
      setProjects([res.data, ...projects]);
      toast.success("Project created");
      setNewProjectName("");
      setIsProjectPopoverOpen(false);
    } catch (e) {
      toast.error("Failed to create project");
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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await api.delete(`/chat/sessions/${id}`);
    setSessions(sessions.filter((s) => s.id !== id));
    toast.success("Deleted");
  };

  const handleRename = async (e: React.MouseEvent, session: any) => {
    e.stopPropagation();
    const newTitle = prompt("Rename:", session.title);
    if (!newTitle) return;
    await api.patch(`/chat/sessions/${session.id}`, { title: newTitle });
    fetchData();
  };

  const handlePin = async (e: React.MouseEvent, session: any) => {
    e.stopPropagation();
    await api.patch(`/chat/sessions/${session.id}`, { is_pinned: !session.is_pinned });
    fetchData();
  };

  const filteredSessions = sessions.filter((s) =>
    (s.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredProjects = projects.filter((p) =>
    (p.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar font-sans text-sidebar-foreground transition-all duration-300 ease-in-out h-full"
      data-testid="app-sidebar"
    >
      <div className="flex h-full w-full flex-col justify-between">
        
        {/* ================= TOP SECTION ================= */}
        <div className="flex flex-col flex-1 min-h-0">
            
            {/* HEADER */}
            <div className="flex flex-col p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center border-b border-sidebar-border/50 bg-sidebar/50 backdrop-blur-sm z-10 transition-all shrink-0">
              
              {/* Brand */}
              <div className="flex items-center gap-3 mb-5 px-1 group-data-[collapsible=icon]:mb-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shrink-0">
                    <Command className="size-5" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden transition-opacity duration-200">
                    <span className="text-base font-bold tracking-tight text-sidebar-foreground leading-none">KodaSync</span>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center rounded-md bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/70 ring-1 ring-inset ring-sidebar-border/50">
                          Pro Plan
                        </span>
                    </div>
                </div>
              </div>

              {/* Tabs */}
              <div className={cn(
                "flex p-1 bg-sidebar-accent/50 rounded-lg mb-4 transition-all border border-sidebar-border/30",
                "group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mb-0 group-data-[collapsible=icon]:border-none"
              )}>
                <TooltipProvider delayDuration={0}>
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <Tooltip key={tab.id}>
                        <TooltipTrigger asChild>
                            <button
                              onClick={() => setActiveTab(tab.id)}
                              className={cn(
                                  "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ease-out",
                                  "group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:rounded-lg",
                                  isActive 
                                    ? "bg-sidebar-background text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border group-data-[collapsible=icon]:bg-sidebar-accent" 
                                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                              )}
                            >
                              <tab.icon className="size-4 group-data-[collapsible=icon]:size-5" strokeWidth={isActive ? 2 : 1.5} />
                              <span className="group-data-[collapsible=icon]:hidden">{tab.label}</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" hidden={state !== "collapsed"}>
                            {tab.label}
                        </TooltipContent>
                      </Tooltip>
                    )
                })}
                </TooltipProvider>
              </div>

              {/* Search - MORE VISIBLE */}
              <div className="flex gap-2 items-center group-data-[collapsible=icon]:hidden transition-all duration-200 opacity-100 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:overflow-hidden">
                <div className="relative group flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-sidebar-foreground transition-colors" strokeWidth={ICON_STROKE} />
                    <input 
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        // FIX: Changed bg to 'bg-background' (White/Dark), added border and shadow-sm for high visibility
                        className="w-full h-9 rounded-lg bg-background pl-9 pr-3 text-sm font-medium text-sidebar-foreground border border-sidebar-border shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-ring/50 focus:border-sidebar-border transition-all"
                    />
                </div>
                
                {activeTab === "chat" ? (
                    <Button 
                      onClick={handleNewChat} 
                      size="icon" 
                      className="h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:brightness-110 shadow-sm shrink-0 border border-sidebar-border/10"
                    >
                      <Plus className="size-5" strokeWidth={2.5} />
                    </Button>
                ) : (
                    <Popover open={isProjectPopoverOpen} onOpenChange={setIsProjectPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                            size="icon" 
                            className="h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:brightness-110 shadow-sm shrink-0 border border-sidebar-border/10"
                        >
                            <Plus className="size-5" strokeWidth={2.5} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-60 p-2" align="end" sideOffset={8}>
                        <div className="flex gap-2">
                            <Input 
                              autoFocus 
                              value={newProjectName} 
                              onChange={e => setNewProjectName(e.target.value)} 
                              onKeyDown={e => e.key === "Enter" && handleCreateProject()} 
                              className="h-9 text-sm font-medium" 
                              placeholder="Project Name..." 
                            />
                            <Button size="sm" onClick={handleCreateProject} className="h-9 w-9 p-0 bg-sidebar-primary text-sidebar-primary-foreground"><Plus className="size-4"/></Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                )}
              </div>
            </div>

            {/* LIST CONTENT */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar group-data-[collapsible=icon]:hidden">
              
              <div className="px-2 mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground/80 uppercase">
                    {activeTab === 'chat' ? 'Conversations' : 'Projects'}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground/50">
                    {activeTab === 'chat' ? filteredSessions.length : filteredProjects.length}
                  </span>
              </div>

              {activeTab === "chat" ? (
                  filteredSessions.length > 0 ? (
                    filteredSessions.map((s) => (
                      <div 
                        key={s.id} 
                        onClick={() => onSelectSession(s.id)} 
                        className="group relative flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent/50 cursor-pointer transition-all duration-200 border border-transparent hover:border-sidebar-border/30"
                      >
                        {s.is_pinned ? (
                            <Pin className="mt-0.5 size-4 shrink-0 text-sidebar-primary fill-sidebar-primary/10" strokeWidth={2} />
                        ) : (
                            <MessageCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" strokeWidth={ICON_STROKE} />
                        )}
                        
                        <div className="flex flex-col min-w-0 flex-1 gap-1 pr-8">
                            <span className={cn(
                              "text-sm font-medium truncate leading-none text-sidebar-foreground/90 group-hover:text-sidebar-foreground transition-colors",
                              s.is_pinned && "font-semibold text-sidebar-foreground"
                            )}>
                              {s.title || "Untitled Chat"}
                            </span>
                            <span className="text-xs text-muted-foreground/60 truncate">
                                {new Date(s.updated_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>

                        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button 
                                    onClick={(e) => e.stopPropagation()} 
                                    variant="ghost"
                                    className="h-7 w-7 p-0 rounded-lg opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity bg-sidebar-background/80 backdrop-blur-sm border border-sidebar-border/50 shadow-sm hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                  >
                                    <MoreHorizontal className="size-4" strokeWidth={2} />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 font-medium p-1.5 shadow-xl border-sidebar-border bg-popover text-popover-foreground">
                                  <DropdownMenuItem onClick={(e) => handleRename(e, s)} className="rounded-md font-medium cursor-pointer">
                                    <Edit2 className="mr-2 size-3.5" /> Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => handlePin(e, s)} className="rounded-md font-medium cursor-pointer">
                                    {s.is_pinned ? <PinOff className="mr-2 size-3.5"/> : <Pin className="mr-2 size-3.5"/>}
                                    {s.is_pinned ? "Unpin Chat" : "Pin Chat"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-1 bg-sidebar-border" />
                                  <DropdownMenuItem onClick={(e) => handleDelete(e, s.id)} className="text-destructive focus:bg-destructive/10 rounded-md font-medium cursor-pointer">
                                    <Trash2 className="mr-2 size-3.5" /> Delete
                                  </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center opacity-50">
                      <Sparkles className="size-8 text-muted-foreground mb-3" strokeWidth={1} />
                      <p className="text-sm font-medium text-muted-foreground">Start a new conversation</p>
                    </div>
                  )
              ) : (
                  filteredProjects.length > 0 ? (
                    filteredProjects.map((p) => (
                      <div 
                        key={p.id} 
                        onClick={() => onSelectProject(p)} 
                        className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent/50 cursor-pointer transition-all duration-200 border border-transparent hover:border-sidebar-border/30"
                      >
                        <div className="size-8 rounded-lg bg-sidebar-accent/50 flex items-center justify-center shrink-0 group-hover:bg-sidebar-background group-hover:shadow-sm transition-all border border-transparent group-hover:border-sidebar-border/50">
                            <Folder className="size-4 text-muted-foreground group-hover:text-sidebar-primary transition-colors" strokeWidth={ICON_STROKE} />
                        </div>
                        <span className="text-sm font-medium text-sidebar-foreground/80 group-hover:text-sidebar-foreground truncate flex-1">
                            {p.name}
                        </span>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="size-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center opacity-50">
                      <Folder className="size-8 text-muted-foreground mb-3" strokeWidth={1} />
                      <p className="text-sm font-medium text-muted-foreground">No projects found</p>
                    </div>
                  )
              )}
            </div>
        </div>
        
        {/* ================= FOOTER ================= */}
        <div className="p-4 border-t border-sidebar-border/40 bg-sidebar/50 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:flex shrink-0 mt-auto">
            <NavUser user={{ name: "Ian", email: "dev@kodasync.com" }} />
        </div>
      </div>
    </Sidebar>
  );
}