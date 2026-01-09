"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  Edit2,
  X,
  Pin,
  Copy,
  Check,
  Search,
  SlidersHorizontal,
  Loader2,
  AlertTriangle,
  Code,
  Hash,
  FileCode,
  Calendar,
  Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
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
}

const getLanguageStyle = (lang: string) => {
  const l = lang?.toLowerCase() || "";
  if (["typescript", "ts", "react", "tsx"].includes(l)) return "text-blue-600 bg-blue-50 border-blue-200 group-hover:border-blue-300";
  if (["javascript", "js", "node", "jsx"].includes(l)) return "text-yellow-600 bg-yellow-50 border-yellow-200 group-hover:border-yellow-300";
  if (["python", "py", "flask", "django"].includes(l)) return "text-green-600 bg-green-50 border-green-200 group-hover:border-green-300";
  if (["html", "css", "scss", "tailwind"].includes(l)) return "text-orange-600 bg-orange-50 border-orange-200 group-hover:border-orange-300";
  if (["sql", "database", "mysql", "postgresql", "prisma"].includes(l)) return "text-purple-600 bg-purple-50 border-purple-200 group-hover:border-purple-300";
  return "text-zinc-600 bg-zinc-100 border-zinc-200 group-hover:border-zinc-300";
};

// 🚀 FIXED: Dynamic Label Formatting
// We rely on the AI to provide correct casing for Tags (e.g. "MySQL", "API").
// We only map Languages because the Editor usually supplies them in strict lowercase.
const formatLabel = (text: string) => {
  if (!text) return "";
  
  // Check strict lowercase map for known Languages
  const lower = text.toLowerCase().trim();
  const langMap: Record<string, string> = {
    html: "HTML",
    css: "CSS",
    sql: "SQL",
    json: "JSON",
    xml: "XML",
    php: "PHP",
    javascript: "JavaScript",
    js: "JavaScript",
    typescript: "TypeScript",
    ts: "TypeScript",
    cpp: "C++",
    csharp: "C#",
    go: "Go",
    bash: "Bash",
    sh: "Bash",
    yaml: "YAML",
    yml: "YAML",
    mysql: "MySQL",
    postgresql: "PostgreSQL",
    pgsql: "PostgreSQL",
  };

  if (langMap[lower]) {
    return langMap[lower];
  }

  // Fallback: Return original text (Preserve AI's casing for tags like 'iOS', 'Next.js')
  // If it's purely lowercase (e.g. user typed it), title case it for neatness.
  if (text === lower) {
      return text.charAt(0).toUpperCase() + text.slice(1);
  }
  
  return text;
};

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function NoteLibrary({
  onEdit,
  projectId,
}: {
  onEdit: (note: Note) => void;
  projectId?: string | null;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteNote, setDeleteNote] = useState<Note | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  useEffect(() => {
    let result = [...notes];

    if (projectId) {
      result = result.filter(n => n.project_id === projectId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        n => 
          n.title.toLowerCase().includes(q) || 
          n.code_snippet.toLowerCase().includes(q) ||
          n.tags?.toLowerCase().includes(q)
      );
    }

    // Case-insensitive tag matching
    if (selectedTags.length > 0) {
      result = result.filter(n => {
        const noteTags = n.tags?.split(",").map(t => t.trim().toLowerCase()) || [];
        return selectedTags.every(tag => noteTags.includes(tag.toLowerCase()));
      });
    }

    setFilteredNotes(result);
  }, [notes, searchQuery, selectedTags, projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notesRes, tagsRes] = await Promise.all([
        api.get("/notes/"),
        api.get("/notes/tags/"),
      ]);
      setNotes(notesRes.data);
      setAvailableTags(tagsRes.data);
    } catch (e) {
      toast.error("Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    const updatedNotes = notes.map((n) => 
      n.id === id ? { ...n, is_pinned: !n.is_pinned } : n
    );
    
    updatedNotes.sort((a, b) => {
      if (a.is_pinned === b.is_pinned) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return a.is_pinned ? -1 : 1;
    });

    setNotes(updatedNotes);

    try {
      await api.patch(`/notes/${id}/pin`);
    } catch (e) {
      toast.error("Failed to pin note");
      fetchData();
    }
  };

  const executeDelete = async () => {
    if (!deleteNote) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/notes/${deleteNote.id}`);
      setNotes(prev => prev.filter((n) => n.id !== deleteNote.id));
      toast.success("Note deleted");
      setDeleteNote(null);
    } catch (e) {
      toast.error("Failed to delete");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground animate-in fade-in">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/50" />
        <p className="text-sm font-medium">Loading your library...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-screen pb-20">
      
      {/* --- FILTER HEADER --- */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 px-4 md:px-8 border-b border-border/40 transition-all">
        <div className="flex flex-col gap-3 max-w-4xl mx-auto">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                    placeholder="Search notes, code, or tags..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-white/50 border-zinc-200 hover:border-zinc-300 focus-visible:ring-primary/20 shadow-sm rounded-xl transition-all"
                />
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className={cn(
                                    "h-7 gap-2 text-xs font-medium border-zinc-200 hover:bg-zinc-50",
                                    selectedTags.length > 0 && "text-primary border-primary/20 bg-primary/5"
                                )}
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                Filters
                                {selectedTags.length > 0 && (
                                    <Badge variant="secondary" className="h-4 px-1 rounded-[4px] bg-primary text-primary-foreground text-[9px] min-w-[1.25rem] justify-center">
                                        {selectedTags.length}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2">
                            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal uppercase tracking-wider">
                                Filter by Tags
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                {availableTags.length === 0 ? (
                                    <div className="text-xs text-muted-foreground p-2 text-center">No tags available</div>
                                ) : (
                                    availableTags.map((tag) => (
                                        <DropdownMenuCheckboxItem
                                            key={tag}
                                            checked={selectedTags.includes(tag)}
                                            onCheckedChange={() => toggleTag(tag)}
                                            className="text-xs font-medium cursor-pointer"
                                        >
                                            {formatLabel(tag)} 
                                        </DropdownMenuCheckboxItem>
                                    ))
                                )}
                            </div>
                            {selectedTags.length > 0 && (
                                <>
                                    <DropdownMenuSeparator />
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="w-full h-7 text-xs text-destructive hover:text-destructive"
                                        onClick={() => setSelectedTags([])}
                                    >
                                        Clear Filters
                                    </Button>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1">
                    {selectedTags.map(tag => (
                        <Badge 
                            key={tag} 
                            variant="secondary" 
                            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200 pl-2 pr-1 py-1 h-6 gap-1 cursor-pointer transition-colors"
                            onClick={() => toggleTag(tag)}
                        >
                            <Hash className="w-3 h-3 text-zinc-400" />
                            {formatLabel(tag)}
                            <X className="w-3 h-3 ml-1 text-zinc-400 hover:text-destructive transition-colors" />
                        </Badge>
                    ))}
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedTags([])}
                        className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
                    >
                        Clear all
                    </Button>
                </div>
            )}
        </div>
      </div>

      {/* --- COMPACT GRID --- */}
      {filteredNotes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto px-4 md:px-8">
            {filteredNotes.map((note) => {
                const langStyle = getLanguageStyle(note.language);
                
                return (
                <Card
                    key={note.id}
                    onClick={() => onEdit(note)}
                    className={cn(
                        "group relative flex flex-col justify-between overflow-hidden transition-all duration-300 bg-white border cursor-pointer hover:shadow-lg hover:-translate-y-1 rounded-xl",
                        note.is_pinned 
                            ? "border-primary/40 bg-primary/[0.01]" 
                            : "border-zinc-200 hover:border-primary/30"
                    )}
                >
                    {/* Header */}
                    <div className="px-3 pt-3 pb-2 flex items-start justify-between gap-2">
                        <div className="flex flex-col min-w-0 gap-1.5">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-zinc-800 truncate group-hover:text-primary transition-colors">
                                    {note.title}
                                </h3>
                                {note.is_pinned && <Pin className="w-3.5 h-3.5 text-primary fill-primary/20 shrink-0" />}
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge 
                                    variant="outline" 
                                    className={cn("h-4 px-1.5 text-[9px] font-bold tracking-wider", langStyle)}
                                >
                                    {formatLabel(note.language)}
                                </Badge>
                                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {timeAgo(note.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="px-3 pb-3 flex-1 min-h-0">
                        <div className="relative bg-zinc-50 border border-zinc-100 rounded-lg p-2.5 h-24 overflow-hidden font-mono text-[10px] leading-relaxed text-zinc-600 select-none group-hover:bg-white group-hover:border-zinc-200 transition-colors">
                            {note.code_snippet}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-transparent to-transparent pointer-events-none group-hover:from-white" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 scale-95 group-hover:scale-100">
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-7 w-7 bg-white shadow-sm border border-zinc-200 hover:bg-zinc-50 hover:text-primary hover:border-primary/30"
                            onClick={(e) => handleCopy(e, note.code_snippet, note.id)}
                        >
                            {copiedId === note.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-7 w-7 bg-white shadow-sm border border-zinc-200 hover:bg-zinc-50 hover:text-primary hover:border-primary/30"
                            onClick={(e) => handlePin(e, note.id)}
                        >
                            <Pin className={cn("w-3.5 h-3.5", note.is_pinned && "fill-primary text-primary")} />
                        </Button>
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-7 w-7 bg-white shadow-sm border border-zinc-200 hover:bg-red-50 hover:text-destructive hover:border-red-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                setDeleteNote(note);
                            }}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </Card>
            )})}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-300 px-4">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center shadow-sm mb-4 border border-zinc-100">
                {searchQuery ? <Search className="w-6 h-6 text-zinc-300" /> : <FileCode className="w-6 h-6 text-zinc-300" />}
            </div>
            <h3 className="text-lg font-bold text-zinc-900">
                {searchQuery ? "No matches found" : "Library Empty"}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                {searchQuery 
                    ? "Try adjusting your filters or search terms."
                    : "Create a note in Studio to see it appear here."}
            </p>
            {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setSelectedTags([]); }} className="mt-4 h-8 text-xs">
                    Clear Search
                </Button>
            )}
        </div>
      )}

      {/* Delete Modal */}
      <Dialog open={!!deleteNote} onOpenChange={(open) => !open && setDeleteNote(null)}>
        <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden border-destructive/20 shadow-2xl">
            <div className="bg-destructive/10 p-6 flex flex-col items-center justify-center border-b border-destructive/10">
                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-3">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <DialogTitle className="text-destructive text-lg font-bold">Delete Item?</DialogTitle>
                <DialogDescription className="text-center text-destructive/80 mt-1 flex flex-col gap-1">
                    You are about to permanently delete
                    <span className="font-bold text-foreground block text-lg">"{deleteNote?.title}"</span>
                </DialogDescription>
            </div>
            <div className="p-6 bg-background">
                <div className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
                    This action <span className="font-bold text-foreground">cannot be undone</span>. All data associated with this note will be removed from our servers forever.
                </div>
                <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setDeleteNote(null)} className="flex-1">Cancel</Button>
                    <Button variant="destructive" onClick={executeDelete} disabled={deleteLoading} className="flex-1 bg-destructive hover:bg-destructive/90">
                        {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Delete Forever
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}