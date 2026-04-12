"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  X,
  Pin,
  Copy,
  Check,
  Search,
  SlidersHorizontal,
  Loader2,
  AlertTriangle,
  LayoutGrid,
  List,
  Clock,
  ArrowUpDown,
  Inbox,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  code_snippet: string;
  language: string;
  tags?: string;
  created_at: string;
  is_pinned?: boolean;
  project_id?: string;
  _normalizedTags?: string[];
  _searchString?: string;
}

type SortOption = "newest" | "oldest" | "alphabetical";
type ViewMode = "grid" | "list";

const formatLabel = (text: string) => {
  if (!text) return "";
  const lower = text.toLowerCase().trim();
  const langMap: Record<string, string> = {
    html: "HTML", css: "CSS", sql: "SQL", json: "JSON", xml: "XML", php: "PHP",
    javascript: "JavaScript", js: "JavaScript", typescript: "TypeScript", ts: "TypeScript",
    cpp: "C++", csharp: "C#", go: "Go", bash: "Bash", sh: "Bash", yaml: "YAML",
    yml: "YAML", mysql: "MySQL", postgresql: "PostgreSQL", pgsql: "PostgreSQL",
  };
  return langMap[lower] || (text === lower ? text.charAt(0).toUpperCase() + text.slice(1) : text);
};

const timeAgo = (dateString: string) => {
  if (!dateString) return "";
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateString).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const ITEMS_PER_PAGE = 12;

export default function NoteLibrary({
  onEdit,
  projectId,
}: {
  onEdit: (note: Note) => void;
  projectId?: string | null;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteNote, setDeleteNote] = useState<Note | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTags, sortBy]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notesRes, tagsRes] = await Promise.all([
        api.get(projectId ? `/notes/?project_id=${projectId}` : "/notes/"),
        api.get("/notes/tags/"),
      ]);
      
      const processed = notesRes.data.map((n: Note) => ({
        ...n,
        _normalizedTags: n.tags ? n.tags.split(",").map(t => t.trim().toLowerCase()) : [],
        _searchString: `${n.title} ${n.code_snippet} ${n.tags || ""}`.toLowerCase(),
      }));
      
      setNotes(processed);
      setAvailableTags(tagsRes.data);
    } catch (e) {
      toast.error("Failed to load library data.");
    } finally {
      setLoading(false);
    }
  };

  const processedNotes = useMemo(() => {
    let result = notes;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => n._searchString?.includes(q));
    }

    if (selectedTags.length > 0) {
      result = result.filter(n => 
        selectedTags.every(tag => n._normalizedTags?.includes(tag.toLowerCase()))
      );
    }

    return result.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      
      if (sortBy === "oldest") return a.created_at.localeCompare(b.created_at);
      if (sortBy === "alphabetical") return a.title.localeCompare(b.title);
      return b.created_at.localeCompare(a.created_at);
    });
  }, [notes, searchQuery, selectedTags, sortBy]);

  const totalPages = Math.ceil(processedNotes.length / ITEMS_PER_PAGE);
  const paginatedNotes = processedNotes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePin = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, is_pinned: !n.is_pinned } : n));
    try {
      await api.patch(`/notes/${id}/pin`);
    } catch (e) {
      toast.error("State synchronization failed.");
      fetchData();
    }
  };

  const executeDelete = async () => {
    if (!deleteNote) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/notes/${deleteNote.id}`);
      setNotes(prev => prev.filter((n) => n.id !== deleteNote.id));
      toast.success("Snippet deleted.");
      setDeleteNote(null);
      
      if (paginatedNotes.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (e) {
      toast.error("Deletion failed.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCopy = useCallback((e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-zinc-400 font-sans">
        <Loader2 className="w-6 h-6 animate-spin mb-4 text-primary" />
        <span className="text-base font-medium tracking-tight text-zinc-500">Syncing workspace...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen font-sans antialiased bg-[#fafafa]">
      
      <div className="sticky top-0 z-20 px-6 pt-12 pb-6 bg-[#fafafa] border-b border-zinc-200/60">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">
                Knowledge Base
              </h1>
              <p className="text-base text-zinc-500 max-w-xl leading-relaxed">
                Everything you have saved, organized, and ready for your next project. 
                Search across all your technical documents instantly.
              </p>
            </div>
            
            <div className="flex items-center gap-2 border border-zinc-200/80 rounded-xl p-1.5 bg-white shadow-sm shrink-0">
              <button 
                onClick={() => setViewMode("grid")}
                className={cn("p-2.5 rounded-lg transition-all", viewMode === "grid" ? "bg-zinc-100/80 text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50")}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={cn("p-2.5 rounded-lg transition-all", viewMode === "list" ? "bg-zinc-100/80 text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50")}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search queries, classes, or syntax..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-white border-zinc-200/80 focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary shadow-sm w-full rounded-xl transition-all"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center gap-2 h-12 px-5 text-sm font-semibold border border-zinc-200/80 bg-white text-zinc-700 rounded-xl hover:bg-zinc-50 hover:border-zinc-300 shadow-sm transition-all w-full sm:w-auto outline-none">
                    <SlidersHorizontal className="w-4 h-4 text-zinc-500" />
                    Filters
                    {selectedTags.length > 0 && (
                      <span className="flex items-center justify-center bg-primary text-primary-foreground text-[11px] h-5 w-5 rounded-md ml-1.5 font-bold shadow-sm">
                        {selectedTags.length}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl border-zinc-200 shadow-xl">
                  <DropdownMenuLabel className="text-sm text-zinc-500 font-medium px-3 py-2">Available Tags</DropdownMenuLabel>
                  <div className="max-h-[300px] overflow-y-auto main-scrollbar px-1">
                    {availableTags.length === 0 ? (
                      <div className="text-sm text-zinc-400 p-3 text-center">No tags indexed</div>
                    ) : (
                      availableTags.map((tag) => (
                        <DropdownMenuCheckboxItem
                          key={tag}
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={() => toggleTag(tag)}
                          className="text-sm cursor-pointer rounded-lg py-2.5 pl-9 pr-3 focus:bg-primary/10 focus:text-primary relative"
                        >
                          {formatLabel(tag)} 
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center gap-2 h-12 px-5 text-sm font-semibold border border-zinc-200/80 bg-white text-zinc-700 rounded-xl hover:bg-zinc-50 hover:border-zinc-300 shadow-sm transition-all w-full sm:w-auto outline-none">
                    <ArrowUpDown className="w-4 h-4 text-zinc-500" />
                    Sort
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 border-zinc-200 shadow-xl">
                  <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <DropdownMenuRadioItem value="newest" className="text-sm font-medium rounded-lg py-2.5 pl-9 pr-3 focus:bg-primary/10 focus:text-primary relative">Newest First</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="oldest" className="text-sm font-medium rounded-lg py-2.5 pl-9 pr-3 focus:bg-primary/10 focus:text-primary relative">Oldest First</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="alphabetical" className="text-sm font-medium rounded-lg py-2.5 pl-9 pr-3 focus:bg-primary/10 focus:text-primary relative">Alphabetical</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedTags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 shadow-sm px-3.5 py-1.5 h-9 gap-2 cursor-pointer transition-all rounded-lg font-semibold text-sm"
                  onClick={() => toggleTag(tag)}
                >
                  {formatLabel(tag)}
                  <X className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-900" />
                </Badge>
              ))}
              <button 
                onClick={() => setSelectedTags([])}
                className="h-9 text-sm text-zinc-500 hover:text-zinc-900 px-3 font-semibold transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
        {processedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="h-24 w-24 bg-white border border-zinc-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Inbox className="w-10 h-10 text-zinc-300 stroke-[1.5]" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">No snippets found</h3>
            <p className="text-base text-zinc-500 mt-2 max-w-sm leading-relaxed">
              Your library is currently empty or no results matched your active filters.
            </p>
          </div>
        ) : (
          <div className="flex flex-col min-h-full pb-8">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => onEdit(note)}
                    className={cn(
                      "group flex flex-col h-[260px] border rounded-2xl bg-white shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
                      note.is_pinned ? "border-primary/50 ring-2 ring-primary/10" : "border-zinc-200/80 hover:border-primary/40"
                    )}
                  >
                    <div className="px-6 py-5 flex items-center justify-between border-b border-zinc-100/80 bg-white rounded-t-2xl">
                      <span className="font-bold text-base text-zinc-900 truncate pr-3">{note.title}</span>
                      {note.is_pinned && <Pin className="w-4 h-4 text-primary fill-primary shrink-0 drop-shadow-sm" />}
                    </div>

                    <div className="flex-1 p-6 bg-zinc-50/30 overflow-hidden">
                      <pre className="font-mono text-xs sm:text-[13px] text-zinc-600 leading-relaxed whitespace-pre-wrap line-clamp-4 break-words">
                        {note.code_snippet}
                      </pre>
                    </div>

                    <div className="px-5 py-4 flex items-center justify-between bg-white rounded-b-2xl border-t border-zinc-100/80">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[11px] font-bold text-zinc-500 tracking-wider uppercase truncate px-2 py-1 bg-zinc-100 rounded-md">
                          {formatLabel(note.language)}
                        </span>
                        <span className="text-[12px] font-medium text-zinc-400 flex items-center gap-1.5 shrink-0">
                          <Clock className="w-3.5 h-3.5 opacity-70" />
                          {timeAgo(note.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          className="p-1.5 text-zinc-400 hover:text-primary rounded-md hover:bg-primary/10 transition-colors"
                          onClick={(e) => handleCopy(e, note.code_snippet, note.id)}
                        >
                          {copiedId === note.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          className="p-1.5 text-zinc-400 hover:text-primary rounded-md hover:bg-primary/10 transition-colors"
                          onClick={(e) => handlePin(e, note.id)}
                        >
                          <Pin className={cn("w-4 h-4", note.is_pinned && "fill-primary text-primary")} />
                        </button>
                        <button
                          className="p-1.5 text-zinc-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                          onClick={(e) => { e.stopPropagation(); setDeleteNote(note); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-zinc-200/80 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="grid grid-cols-[1fr_140px_140px_120px] gap-4 px-6 py-4 bg-zinc-50 border-b border-zinc-100 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <div>Document details</div>
                  <div>Language</div>
                  <div>Last modified</div>
                  <div className="text-right">Actions</div>
                </div>
                
                <div className="divide-y divide-zinc-100">
                  {paginatedNotes.map((note) => (
                    <div 
                      key={note.id}
                      onClick={() => onEdit(note)}
                      className="group grid grid-cols-[1fr_140px_140px_120px] gap-4 px-6 py-4 items-center hover:bg-zinc-50 cursor-pointer transition-colors"
                    >
                      <div className="flex flex-col min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-zinc-900 truncate group-hover:text-primary transition-colors">{note.title}</span>
                          {note.is_pinned && <Pin className="w-3.5 h-3.5 text-primary fill-primary shrink-0" />}
                        </div>
                        <span className="text-[13px] text-zinc-500 font-mono truncate mt-1">{note.code_snippet.split('\n')[0].trim()}</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-md">
                          {formatLabel(note.language)}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-zinc-500 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 opacity-70" />
                        {timeAgo(note.created_at)}
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 text-zinc-400 hover:text-primary rounded-md transition-colors hover:bg-primary/10"
                          onClick={(e) => handleCopy(e, note.code_snippet, note.id)}
                        >
                          {copiedId === note.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          className="p-2 text-zinc-400 hover:text-red-600 rounded-md transition-colors hover:bg-red-50"
                          onClick={(e) => { e.stopPropagation(); setDeleteNote(note); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-zinc-200/60">
                <p className="text-sm text-zinc-500 font-medium">
                  Showing <span className="text-zinc-900 font-bold">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="text-zinc-900 font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, processedNotes.length)}</span> of <span className="text-zinc-900 font-bold">{processedNotes.length}</span> results
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm bg-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1.5 px-2">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={cn(
                          "w-10 h-10 rounded-xl text-sm font-bold transition-all shadow-sm",
                          currentPage === i + 1 
                            ? "bg-primary text-primary-foreground border border-primary" 
                            : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm bg-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!deleteNote} onOpenChange={(open) => !open && setDeleteNote(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-zinc-200 shadow-xl bg-white rounded-2xl">
          <div className="p-7">
            <div className="flex gap-5">
              <div className="mt-1 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-zinc-900 tracking-tight">Delete Document</DialogTitle>
                <DialogDescription className="text-zinc-500 mt-2 text-base leading-relaxed font-medium">
                  Are you sure you want to delete <span className="font-bold text-zinc-800">"{deleteNote?.title}"</span>? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </div>
          <div className="px-7 py-5 bg-zinc-50/80 border-t border-zinc-100 flex gap-3 justify-end">
            <button 
              onClick={() => setDeleteNote(null)} 
              className="h-11 px-6 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 shadow-sm rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={executeDelete} 
              disabled={deleteLoading} 
              className="h-11 px-6 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all flex items-center shadow-sm hover:shadow"
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {deleteLoading ? "Deleting..." : "Delete Permanently"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}