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
  MoreVertical,
  Folder,
  Trash2,
  Edit2,
  Pin,
  PinOff,
  Command,
  Sparkles,
  FileCode,
  Copy,
  Loader2,
  AlertTriangle // 🚀 Warning Icon
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose
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

const ICON_STROKE = 1.5;

const TABS = [
  { id: "library", label: "Library", icon: Library },
  { id: "create", label: "Studio", icon: Code2 },
  { id: "chat", label: "Chat", icon: MessageSquare },
];

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
}: {
  activeTab: string;
  setActiveTab: (val: string) => void;
  onSelectProject: (project: any) => void;
  onSelectSession: (sessionId: string | null, title?: string) => void;
  onSelectNote?: (note: any) => void;
  currentSessionId?: string | null;
}) {
  const { state } = useSidebar();
  const [projects, setProjects] = React.useState<any[]>([]);
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [notes, setNotes] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [newItemName, setNewItemName] = React.useState("");
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  // 🚀 RENAME STATE
  const [renameItem, setRenameItem] = React.useState<{ id: string, type: 'session' | 'project' | 'note', currentName: string } | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [renameLoading, setRenameLoading] = React.useState(false);

  // 🚀 DELETE MODAL STATE
  const [deleteItem, setDeleteItem] = React.useState<{ id: string, type: 'session' | 'project' | 'note', name: string } | null>(null);
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
    } catch (e) { }
  };

  const handleCreate = async () => {
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
    } catch (e) { toast.error("Error starting chat"); }
  };

  // 🚀 OPEN DELETE MODAL (Instead of window.confirm)
  const confirmDelete = (e: React.MouseEvent, item: any, type: 'session' | 'project' | 'note') => {
      e.stopPropagation();
      setDeleteItem({ 
          id: item.id, 
          type, 
          name: item.title || item.name || "Untitled Item" 
      });
  };

  // 🚀 EXECUTE DELETE
  const executeDelete = async () => {
    if (!deleteItem) return;
    setDeleteLoading(true);
    const { id, type } = deleteItem;

    try {
        if (type === 'session') {
            await api.delete(`/chat/sessions/${id}`);
            setSessions(sessions.filter((s) => s.id !== id));
            if (currentSessionId === id) onSelectSession(null);
        } else if (type === 'project') {
            await api.delete(`/projects/${id}`);
            setProjects(projects.filter((p) => p.id !== id));
        } else if (type === 'note') {
            await api.delete(`/notes/${id}`);
            setNotes(notes.filter((n) => n.id !== id));
        }
        toast.success("Item deleted permanently");
        setDeleteItem(null); // Close modal
    } catch (e) { 
        toast.error("Failed to delete item"); 
    } finally {
        setDeleteLoading(false);
    }
  };

  const openRenameDialog = (e: React.MouseEvent, item: any, type: 'session' | 'project' | 'note') => {
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
        if (type === 'session') {
             await api.patch(`/chat/sessions/${id}`, { title: newName });
             setSessions(sessions.map(s => s.id === id ? { ...s, title: newName } : s));
             if (currentSessionId === id) onSelectSession(id, newName);
        } else if (type === 'project') {
             await api.patch(`/projects/${id}`, { name: newName });
             setProjects(projects.map(p => p.id === id ? { ...p, name: newName } : p));
        } else if (type === 'note') {
             await api.put(`/notes/${id}`, { title: newName });
             setNotes(notes.map(n => n.id === id ? { ...n, title: newName } : n));
        }
        toast.success("Renamed successfully");
        setRenameItem(null);
      } catch (e) { 
        toast.error("Failed to rename");
      } finally {
        setRenameLoading(false);
      }
  };

  const handlePin = async (e: React.MouseEvent, item: any, type: 'session' | 'project') => {
    e.stopPropagation();
    try {
        const newStatus = !item.is_pinned;
        if (type === 'session') {
             setSessions(sessions.map(s => s.id === item.id ? { ...s, is_pinned: newStatus } : s));
             await api.patch(`/chat/sessions/${item.id}`, { is_pinned: newStatus });
        } else if (type === 'project') {
             setProjects(projects.map(p => p.id === item.id ? { ...p, is_pinned: newStatus } : p));
             await api.patch(`/projects/${item.id}`, { is_pinned: newStatus });
        }
    } catch (e) { toast.error("Failed to pin"); }
  };

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
      e.stopPropagation();
      navigator.clipboard.writeText(code);
      toast.success("Code copied");
  }

  const filteredSessions = sessions.filter((s) => (s.title || "").toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProjects = projects.filter((p) => (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredNotes = notes.filter((n) => (n.title || "").toLowerCase().includes(searchQuery.toLowerCase()));

  const renderList = () => {
    if (activeTab === 'chat') {
        if (filteredSessions.length === 0) return <EmptyState icon={Sparkles} label="Start a new chat" />;
        return filteredSessions.map(s => (
            <SidebarItem 
                key={s.id} 
                icon={s.is_pinned ? Pin : MessageCircle} 
                label={s.title || "Untitled Chat"} 
                subLabel={new Date(s.updated_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                isActive={s.id === currentSessionId}
                isPinned={s.is_pinned}
                onClick={() => onSelectSession(s.id, s.title)}
                actions={
                    <>
                        <DropdownMenuItem onClick={(e) => openRenameDialog(e, s, 'session')}><Edit2 className="mr-2 size-3.5"/>Rename</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handlePin(e, s, 'session')}>{s.is_pinned ? <PinOff className="mr-2 size-3.5"/> : <Pin className="mr-2 size-3.5"/>}{s.is_pinned ? "Unpin" : "Pin"}</DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1"/>
                        <DropdownMenuItem onClick={(e) => confirmDelete(e, s, 'session')} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 size-3.5"/>Delete</DropdownMenuItem>
                    </>
                }
            />
        ));
    }
    
    if (activeTab === 'create') {
        if (filteredNotes.length === 0) return <EmptyState icon={FileCode} label="No notes created yet" />;
        return filteredNotes.map(n => (
            <SidebarItem 
                key={n.id} 
                icon={FileCode} 
                label={n.title || "Untitled Note"} 
                subLabel={formatLabel(n.language)}
                onClick={() => onSelectNote && onSelectNote(n)}
                actions={
                    <>
                        <DropdownMenuItem onClick={(e) => handleCopyCode(e, n.code_snippet)}><Copy className="mr-2 size-3.5"/>Copy Code</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => openRenameDialog(e, n, 'note')}><Edit2 className="mr-2 size-3.5"/>Rename</DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1"/>
                        <DropdownMenuItem onClick={(e) => confirmDelete(e, n, 'note')} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 size-3.5"/>Delete</DropdownMenuItem>
                    </>
                }
            />
        ));
    }

    if (filteredProjects.length === 0) return <EmptyState icon={Folder} label="No projects found" />;
    return filteredProjects.map(p => (
        <SidebarItem 
            key={p.id} 
            icon={p.is_pinned ? Pin : Folder} 
            label={p.name} 
            isActive={false}
            isPinned={p.is_pinned}
            onClick={() => onSelectProject(p)}
            actions={
                <>
                    <DropdownMenuItem onClick={(e) => openRenameDialog(e, p, 'project')}><Edit2 className="mr-2 size-3.5"/>Rename</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handlePin(e, p, 'project')}>{p.is_pinned ? <PinOff className="mr-2 size-3.5"/> : <Pin className="mr-2 size-3.5"/>}{p.is_pinned ? "Unpin" : "Pin"}</DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1"/>
                    <DropdownMenuItem onClick={(e) => confirmDelete(e, p, 'project')} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 size-3.5"/>Delete</DropdownMenuItem>
                </>
            }
        />
    ));
  };

  return (
    <>
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar font-sans text-sidebar-foreground transition-all duration-300 ease-in-out h-full" data-testid="app-sidebar">
      <div className="flex h-full w-full flex-col justify-between">
        <div className="flex flex-col flex-1 min-h-0">
            {/* HEADER AREA */}
            <div className="flex flex-col p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center border-b border-sidebar-border/50 bg-sidebar/50 backdrop-blur-sm z-10 transition-all shrink-0">
              <div className="flex items-center gap-3 mb-5 px-1 group-data-[collapsible=icon]:mb-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shrink-0"><Command className="size-5" strokeWidth={2.5} /></div>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden transition-opacity duration-200"><span className="text-base font-bold tracking-tight text-sidebar-foreground leading-none">KodaSync</span><div className="flex items-center gap-1.5 mt-1"><span className="inline-flex items-center rounded-md bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/70 ring-1 ring-inset ring-sidebar-border/50">Pro Plan</span></div></div>
              </div>

              {/* TABS */}
              <div className="flex p-1 bg-sidebar-accent/50 rounded-lg mb-4 transition-all border border-sidebar-border/30 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mb-0 group-data-[collapsible=icon]:border-none">
                <TooltipProvider delayDuration={0}>
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <Tooltip key={tab.id}>
                        <TooltipTrigger asChild><button onClick={() => setActiveTab(tab.id)} className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ease-out group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:rounded-lg", isActive ? "bg-sidebar-background text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border group-data-[collapsible=icon]:bg-sidebar-accent" : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50")}><tab.icon className="size-4 group-data-[collapsible=icon]:size-5" strokeWidth={isActive ? 2 : 1.5} /><span className="group-data-[collapsible=icon]:hidden">{tab.label}</span></button></TooltipTrigger>
                        <TooltipContent side="right" hidden={state !== "collapsed"}>{tab.label}</TooltipContent>
                      </Tooltip>
                    )
                })}
                </TooltipProvider>
              </div>

              {/* SEARCH & ADD */}
              <div className="flex gap-2 items-center group-data-[collapsible=icon]:hidden transition-all duration-200 opacity-100 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:overflow-hidden">
                <div className="relative group flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-sidebar-foreground transition-colors" strokeWidth={ICON_STROKE} />
                    <input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-9 rounded-lg bg-background pl-9 pr-3 text-sm font-medium text-sidebar-foreground border border-sidebar-border shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-ring/50 focus:border-sidebar-border transition-all"/>
                </div>
                
                {activeTab === "chat" ? (
                    <Button onClick={handleNewChat} size="icon" className="h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:brightness-110 shadow-sm shrink-0 border border-sidebar-border/10"><Plus className="size-5" strokeWidth={2.5} /></Button>
                ) : activeTab === "create" ? (
                    <Button onClick={() => { if(onSelectNote) onSelectNote(null) }} size="icon" className="h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:brightness-110 shadow-sm shrink-0 border border-sidebar-border/10"><Plus className="size-5" strokeWidth={2.5} /></Button>
                ) : (
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                      <PopoverTrigger asChild><Button size="icon" className="h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:brightness-110 shadow-sm shrink-0 border border-sidebar-border/10"><Plus className="size-5" strokeWidth={2.5} /></Button></PopoverTrigger>
                      <PopoverContent className="w-60 p-2" align="end" sideOffset={8}><div className="flex gap-2"><Input autoFocus value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreate()} className="h-9 text-sm font-medium" placeholder="Name..." /><Button size="sm" onClick={handleCreate} className="h-9 w-9 p-0 bg-sidebar-primary text-sidebar-primary-foreground"><Plus className="size-4"/></Button></div></PopoverContent>
                    </Popover>
                )}
              </div>
            </div>

            {/* LIST AREA */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 sidebar-scrollbar group-data-[collapsible=icon]:hidden">
              <div className="px-2 mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground/80 uppercase">{activeTab === 'chat' ? 'Conversations' : activeTab === 'create' ? 'Saved Notes' : 'Projects'}</span>
                  <span className="text-xs font-medium text-muted-foreground/50">{activeTab === 'chat' ? filteredSessions.length : activeTab === 'create' ? filteredNotes.length : filteredProjects.length}</span>
              </div>
              {renderList()}
            </div>
        </div>
        
        {/* FOOTER */}
        <div className="p-4 border-t border-sidebar-border/40 bg-sidebar/50 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:flex shrink-0 mt-auto">
            <NavUser user={{ name: "Ian", email: "dev@kodasync.com" }} />
        </div>
      </div>
    </Sidebar>

    {/* 🚀 RENAME DIALOG */}
    <Dialog open={!!renameItem} onOpenChange={(open) => !open && setRenameItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Rename {renameItem?.type === 'note' ? 'Note' : renameItem?.type === 'project' ? 'Project' : 'Chat'}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <Input 
                    value={renameValue} 
                    onChange={(e) => setRenameValue(e.target.value)} 
                    placeholder="Enter new name..." 
                    onKeyDown={(e) => e.key === 'Enter' && executeRename()}
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

    {/* 🚀 BEAUTIFUL DELETE MODAL */}
    <Dialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden border-destructive/20 shadow-2xl">
            <div className="bg-destructive/10 p-6 flex flex-col items-center justify-center border-b border-destructive/10">
                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-3">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <DialogTitle className="text-destructive text-lg font-bold">Delete Item?</DialogTitle>
                <DialogDescription className="text-center text-destructive/80 mt-1 max-w-[280px]">
                    You are about to permanently delete <br/><span className="font-bold text-foreground">"{deleteItem?.name}"</span>
                </DialogDescription>
            </div>
            
            <div className="p-6 bg-background">
                <div className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
                    This action <span className="font-bold text-foreground">cannot be undone</span>. All data associated with this {deleteItem?.type} will be removed from our servers forever.
                </div>
                
                <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setDeleteItem(null)} className="flex-1">
                        Cancel
                    </Button>
                    <Button 
                        variant="destructive" 
                        onClick={executeDelete} 
                        disabled={deleteLoading}
                        className="flex-1 bg-destructive hover:bg-destructive/90"
                    >
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

const SidebarItem = ({ icon: Icon, label, subLabel, isActive, isPinned, onClick, actions }: any) => (
  <div onClick={onClick} className={cn("group relative flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent/50 cursor-pointer transition-all duration-200 border border-transparent hover:border-sidebar-border/30", isActive && "bg-sidebar-accent border-sidebar-border/50 shadow-sm")}>
    {isPinned ? <Pin className="mt-0.5 size-4 shrink-0 text-sidebar-primary fill-sidebar-primary/10" strokeWidth={2} /> : <Icon className={cn("mt-0.5 size-4 shrink-0 transition-colors", isActive ? "text-sidebar-foreground" : "text-muted-foreground group-hover:text-sidebar-foreground")} strokeWidth={ICON_STROKE} />}
    <div className="flex flex-col min-w-0 flex-1 gap-0.5 pr-8">
        <span className={cn("text-sm font-medium truncate text-sidebar-foreground/90 group-hover:text-sidebar-foreground transition-colors capitalize", isPinned && "font-semibold text-sidebar-foreground")}>{label}</span>
        {subLabel && <span className="text-xs text-muted-foreground/60 truncate capitalize">{subLabel}</span>}
    </div>
    <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20">
        <DropdownMenu>
            <DropdownMenuTrigger asChild><Button onClick={(e) => e.stopPropagation()} variant="ghost" className="h-7 w-5 p-0 rounded-md opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity hover:bg-sidebar-background hover:text-sidebar-foreground"><MoreVertical className="size-4 text-muted-foreground" strokeWidth={2} /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 font-medium p-1.5 shadow-xl border-sidebar-border bg-popover text-popover-foreground">{actions}</DropdownMenuContent>
        </DropdownMenu>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, label }: any) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center opacity-50">
      <Icon className="size-8 text-muted-foreground mb-3" strokeWidth={1} />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
  </div>
);