"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Edit,
  X,
  Pin,
  Copy,
  MoreHorizontal,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

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

export default function NoteLibrary({
  onEdit,
  projectId,
}: {
  onEdit: (note: Note) => void;
  projectId?: string | null;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notesRes, tagsRes] = await Promise.all([
        api.get("/notes/"),
        api.get("/notes/tags/"),
      ]);
      setNotes(notesRes.data);
      setTags(tagsRes.data);
    } catch (e) {
      toast.error("Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.patch(`/notes/${id}/pin`);
      setNotes(
        notes.map((n) => (n.id === id ? { ...n, is_pinned: !n.is_pinned } : n))
      );
      fetchData();
    } catch (e) {
      toast.error("Failed to pin note");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this memory?")) return;

    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter((n) => n.id !== id));
      toast.success("Memory deleted");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredNotes = notes.filter((n) => {
    if (projectId && n.project_id !== projectId) return false;
    if (selectedTag && !n.tags?.includes(selectedTag)) return false;
    return true;
  });

  const visibleTags = tags.slice(0, 4);
  const hiddenTags = tags.slice(4);

  if (loading)
    return (
      <div className="text-muted-foreground text-center py-10 font-kodaSync text-lg">
        Loading Library...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* FILTER BAR */}
      <div className="flex items-center gap-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2">
          {projectId ? "Project Filters" : "Global Filters"}
        </div>

        {selectedTag && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTag(null)}
            className="h-6 px-2 text-destructive bg-destructive/10 hover:bg-destructive/20 text-xs rounded-full"
            data-testid="clear-tags-btn"
          >
            <X className="w-3 h-3 mr-1" /> Clear
          </Button>
        )}

        {visibleTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            data-testid={`tag-filter-${tag}`}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
              selectedTag === tag
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-foreground hover:text-foreground"
            }`}
          >
            {tag}
          </button>
        ))}

        {hiddenTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-2 py-1 rounded-full text-xs font-medium bg-card text-muted-foreground border border-border hover:border-foreground hover:text-foreground flex items-center">
                More <MoreHorizontal className="w-3 h-3 ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border-border text-popover-foreground">
              {hiddenTags.map((tag) => (
                <DropdownMenuItem
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className="cursor-pointer"
                  data-testid={`tag-filter-more-${tag}`}
                >
                  {tag}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* NOTES GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.map((note) => (
          <Card
            key={note.id}
            data-testid={`note-card-${note.id}`}
            className={`bg-card border flex flex-col transition-all group relative overflow-hidden ${
              note.is_pinned
                ? "border-yellow-500/50 shadow-sm"
                : "border-border hover:border-foreground/50"
            }`}
          >
            {note.is_pinned && (
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-yellow-500/10 to-transparent pointer-events-none" />
            )}

            <CardHeader className="pb-2 relative z-10">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl font-kodaSync font-bold truncate pr-6 text-card-foreground">
                  {note.title}
                </CardTitle>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => handlePin(e, note.id)}
                    data-testid={`pin-note-${note.id}`}
                    className={`p-1.5 rounded-md transition-colors ${
                      note.is_pinned
                        ? "text-yellow-500 bg-yellow-500/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Pin
                      className={`w-3.5 h-3.5 ${
                        note.is_pinned ? "fill-yellow-500" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 relative group/code">
              <div className="bg-zinc-950 p-3 rounded-md font-mono text-xs text-muted-foreground h-24 overflow-hidden relative border border-border">
                {note.code_snippet}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 to-transparent pointer-events-none" />
                <div className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                    onClick={(e) => handleCopy(e, note.code_snippet, note.id)}
                    data-testid={`copy-note-${note.id}`}
                  >
                    {copiedId === note.id ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="px-1.5 py-0.5 bg-accent text-accent-foreground text-[10px] rounded border border-border uppercase font-bold tracking-wider">
                  {note.language}
                </span>
                {note.tags
                  ?.split(",")
                  .slice(0, 2)
                  .map((tag, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 text-muted-foreground text-[10px]"
                    >
                      #{tag.trim()}
                    </span>
                  ))}
              </div>
            </CardContent>

            <CardFooter className="pt-0 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity border-t border-border mt-2 py-2 px-4 bg-muted/30">
              <span className="text-[10px] text-muted-foreground">
                {new Date(note.created_at).toLocaleDateString()}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(note)}
                  data-testid={`edit-note-${note.id}`}
                  className="h-7 w-7 hover:text-primary"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDelete(e, note.id)}
                  data-testid={`delete-note-${note.id}`}
                  className="h-7 w-7 hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div
          className="text-center py-20 border border-dashed border-border rounded-lg"
          data-testid="empty-state"
        >
          <h3 className="text-lg text-foreground font-kodaSync">
            Empty Collection
          </h3>
          <p className="text-sm text-muted-foreground">
            {projectId
              ? "No notes found in this project yet."
              : "No notes found."}
          </p>
        </div>
      )}
    </div>
  );
}
