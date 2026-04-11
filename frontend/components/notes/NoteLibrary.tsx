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
  Code2,
  LayoutGrid,
  List,
  Clock,
  ArrowUpDown
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
  return new Date(dateString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

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
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteNote, setDeleteNote] = useState<Note | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId]);

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
        <Loader2 className="w-5 h-5 animate-spin mb-3" />
        <span className="text-sm font-medium tracking-tight">Syncing workspace...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen font-sans antialiased">
      
      <div className="sticky top-0 z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">Library</h1>
            <div className="flex items-center gap-1 border border-zinc-200 rounded-md p-0.5 bg-white/50 backdrop-blur-sm">
              <button 
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded-sm transition-colors", viewMode === "grid" ? "bg-white shadow-sm text-zinc-900 border border-zinc-200/50" : "text-zinc-500 hover:text-zinc-900")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-sm transition-colors", viewMode === "list" ? "bg-white shadow-sm text-zinc-900 border border-zinc-200/50" : "text-zinc-500 hover:text-zinc-900")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input 
                placeholder="Search queries, classes, or syntax..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white border-zinc-200 focus-visible:ring-1 focus-visible:ring-[#e26a35]/50 focus-visible:border-[#e26a35] text-sm shadow-sm w-full"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center gap-2 h-9 px-3 text-sm font-medium border border-zinc-200 bg-white text-zinc-700 rounded-md hover:bg-zinc-50 shadow-sm transition-colors w-full sm:w-auto outline-none">
                    <SlidersHorizontal className="w-4 h-4 text-zinc-500" />
                    Filters
                    {selectedTags.length > 0 && (
                      <span className="flex items-center justify-center bg-[#e26a35] text-white text-[10px] h-4 w-4 rounded-sm ml-1 font-semibold">
                        {selectedTags.length}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-zinc-200 shadow-lg">
                  <DropdownMenuLabel className="text-xs text-zinc-500 font-medium px-2 py-1.5">Available Tags</DropdownMenuLabel>
                  <div className="max-h-[250px] overflow-y-auto">
                    {availableTags.length === 0 ? (
                      <div className="text-xs text-zinc-400 p-2">No tags indexed</div>
                    ) : (
                      availableTags.map((tag) => (
                        <DropdownMenuCheckboxItem
                          key={tag}
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={() => toggleTag(tag)}
                          className="text-[13px] cursor-pointer rounded-md"
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
                  <button className="flex items-center justify-center gap-2 h-9 px-3 text-sm font-medium border border-zinc-200 bg-white text-zinc-700 rounded-md hover:bg-zinc-50 shadow-sm transition-colors w-full sm:w-auto outline-none">
                    <ArrowUpDown className="w-4 h-4 text-zinc-500" />
                    Sort
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 border-zinc-200 shadow-lg">
                  <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <DropdownMenuRadioItem value="newest" className="text-[13px] rounded-md">Newest First</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="oldest" className="text-[13px] rounded-md">Oldest First</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="alphabetical" className="text-[13px] rounded-md">Alphabetical</DropdownMenuRadioItem>
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
                  className="bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-sm px-2.5 py-1 h-7 gap-1.5 cursor-pointer transition-colors rounded-md font-medium text-[11px]"
                  onClick={() => toggleTag(tag)}
                >
                  {formatLabel(tag)}
                  <X className="w-3 h-3 text-zinc-400 hover:text-zinc-900" />
                </Badge>
              ))}
              <button 
                onClick={() => setSelectedTags([])}
                className="h-7 text-[11px] text-zinc-500 hover:text-zinc-900 px-2 font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
        {processedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Code2 className="w-10 h-10 text-zinc-300 mb-4 stroke-[1.5]" />
            <h3 className="text-[15px] font-medium text-zinc-900">No snippets found</h3>
            <p className="text-sm text-zinc-500 mt-1">Try adjusting your filters or search query.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {processedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onEdit(note)}
                className={cn(
                  "group flex flex-col h-[200px] border rounded-lg bg-white shadow-sm cursor-pointer transition-colors hover:border-[#e26a35]/50 hover:shadow-md",
                  note.is_pinned ? "border-[#e26a35]/30 ring-1 ring-[#e26a35]/10" : "border-zinc-200"
                )}
              >
                <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-100/80">
                  <span className="font-medium text-sm text-zinc-900 truncate pr-2">{note.title}</span>
                  {note.is_pinned && <Pin className="w-3.5 h-3.5 text-[#e26a35] fill-[#e26a35] shrink-0" />}
                </div>

                <div className="flex-1 p-4 bg-zinc-50/50 overflow-hidden">
                  <pre className="font-mono text-[11px] text-zinc-600 leading-relaxed whitespace-pre-wrap line-clamp-4 break-words">
                    {note.code_snippet}
                  </pre>
                </div>

                <div className="px-4 py-2.5 border-t border-zinc-100/80 flex items-center justify-between bg-white rounded-b-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-zinc-500 tracking-wide uppercase">
                      {formatLabel(note.language)}
                    </span>
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(note.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 text-zinc-400 hover:text-[#e26a35] rounded-md hover:bg-orange-50 transition-colors"
                      onClick={(e) => handleCopy(e, note.code_snippet, note.id)}
                    >
                      {copiedId === note.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      className="p-1.5 text-zinc-400 hover:text-[#e26a35] rounded-md hover:bg-orange-50 transition-colors"
                      onClick={(e) => handlePin(e, note.id)}
                    >
                      <Pin className={cn("w-3.5 h-3.5", note.is_pinned && "fill-[#e26a35] text-[#e26a35]")} />
                    </button>
                    <button
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                      onClick={(e) => { e.stopPropagation(); setDeleteNote(note); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="grid grid-cols-[auto_1fr_120px_100px_100px] gap-4 px-4 py-2.5 bg-zinc-50/80 border-b border-zinc-200 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              <div className="w-6"></div>
              <div>Snippet</div>
              <div>Language</div>
              <div>Added</div>
              <div className="text-right">Actions</div>
            </div>
            
            <div className="divide-y divide-zinc-100">
              {processedNotes.map((note) => (
                <div 
                  key={note.id}
                  onClick={() => onEdit(note)}
                  className="group grid grid-cols-[auto_1fr_120px_100px_100px] gap-4 px-4 py-3 items-center hover:bg-zinc-50/50 cursor-pointer transition-colors"
                >
                  <div className="w-6 flex justify-center">
                    {note.is_pinned ? <Pin className="w-4 h-4 text-[#e26a35] fill-[#e26a35]" /> : <Code2 className="w-4 h-4 text-zinc-300" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-zinc-900 truncate">{note.title}</span>
                    <span className="text-[11px] text-zinc-500 font-mono truncate mt-0.5">{note.code_snippet.split('\n')[0].trim()}</span>
                  </div>
                  <div className="text-xs font-medium text-zinc-600">
                    {formatLabel(note.language)}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {timeAgo(note.created_at)}
                  </div>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 text-zinc-400 hover:text-[#e26a35] rounded-md transition-colors"
                      onClick={(e) => handleCopy(e, note.code_snippet, note.id)}
                    >
                      {copiedId === note.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded-md transition-colors"
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
      </div>

      <Dialog open={!!deleteNote} onOpenChange={(open) => !open && setDeleteNote(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-zinc-200 shadow-xl bg-white">
          <div className="p-6">
            <div className="flex gap-4">
              <div className="mt-1 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-zinc-900">Delete Snippet</DialogTitle>
                <DialogDescription className="text-zinc-500 mt-1.5 text-sm">
                  Are you sure you want to delete "{deleteNote?.title}"? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-transparent border-t border-zinc-100 flex gap-2 justify-end">
            <button 
              onClick={() => setDeleteNote(null)} 
              className="h-9 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 shadow-sm rounded-md hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={executeDelete} 
              disabled={deleteLoading} 
              className="h-9 px-4 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex items-center shadow-sm"
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {deleteLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}