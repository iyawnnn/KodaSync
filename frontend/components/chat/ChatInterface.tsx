"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import Cookies from "js-cookie";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Send, StopCircle, Plus, Globe, Code2, Terminal, Cpu, Zap, ArrowRight, FileText, Sparkles, Database, Search, ShieldCheck, Layout, BookOpen
} from "lucide-react";
import { toast } from "sonner";
import MessageBubble from "./MessageBubble";
import ProjectSelector from "@/components/shared/ProjectSelector";
import NoteCreator from "@/components/notes/NoteCreator";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const SUGGESTION_POOL = [
  { label: "Refactor Code", text: "Refactor this code to be more clean, efficient, and modern:", icon: Code2 },
  { label: "Debug Python", text: "Help me find and fix the bug in this Python script:", icon: Terminal },
  { label: "React Hook", text: "Write a custom React hook to handle form validation:", icon: Cpu },
  { label: "SQL Query", text: "Write an optimized SQL query to join these three tables:", icon: Database },
  { label: "Explain Regex", text: "Explain what this Regular Expression does step-by-step:", icon: Search },
  { label: "Generate Tests", text: "Write comprehensive unit tests for this function using Jest:", icon: ShieldCheck },
  { label: "CSS Grid", text: "Create a responsive grid layout using Tailwind CSS:", icon: Layout },
  { label: "API Route", text: "Create a Next.js API route that handles a POST request:", icon: Zap },
];

export default function ChatInterface({ sessionId }: { sessionId?: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Hello");
  const [subGreeting, setSubGreeting] = useState("How can I help you code today?");
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState(SUGGESTION_POOL.slice(0, 4));

  const [capturedCode, setCapturedCode] = useState<{code: string, lang: string} | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const [isNotePickerOpen, setIsNotePickerOpen] = useState(false);
  const [availableNotes, setAvailableNotes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamBufferRef = useRef("");
  const isAtBottomRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const date = new Date();
    const hour = date.getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    const shuffled = [...SUGGESTION_POOL].sort(() => 0.5 - Math.random());
    setActiveSuggestions(shuffled.slice(0, 4));
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadHistory(sessionId);
    } else {
      setMessages([]);
    }
    return () => abortControllerRef.current?.abort();
  }, [sessionId]);

  const loadHistory = async (id: string) => {
    setMessages([]); 
    setLoading(true);
    try {
      const res = await api.get(`/chat/sessions/${id}/messages`);
      setMessages(res.data);
      setTimeout(() => {
        isAtBottomRef.current = true;
        scrollToBottom(true);
      }, 100);
    } catch (e: any) {
      if (e.response && e.response.status === 404) {
        router.replace("/dashboard");
      } else {
        toast.error("Could not load history");
      }
    } finally {
        setLoading(false);
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 150;
  };

  const scrollToBottom = (instant = false) => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: instant ? "instant" : "smooth" });
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      toast.info("Stopped");
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const handleSaveCode = (code: string, lang: string) => {
      setCapturedCode({ code, lang });
      setIsCreatorOpen(true);
  };

  const handleOpenNotePicker = async () => {
      setIsToolsOpen(false);
      setIsNotePickerOpen(true);
      try {
          const res = await api.get("/notes/");
          setAvailableNotes(res.data);
      } catch (e) {
          toast.error("Could not load notes.");
      }
  };

  const handleImportNote = (note: any) => {
      const noteContent = note.code_snippet; 
      setInput((prev) => {
          const trimmedPrev = prev.trimEnd();
          return trimmedPrev ? `${trimmedPrev}\n${noteContent}` : noteContent;
      });
      setIsNotePickerOpen(false);
      toast.success("Code imported");
      setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleUrlImportSuccess = (data: any) => {
      const noteContent = data.code_snippet;
      setInput((prev) => {
          const trimmedPrev = prev.trimEnd();
          return trimmedPrev ? `${trimmedPrev}\n${noteContent}` : noteContent;
      });
      setIsToolsOpen(false); 
      setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    let currentSessionId = sessionId;
    setLoading(true);

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    const messageContent = input;
    setInput("");
    
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    isAtBottomRef.current = true;
    setTimeout(() => scrollToBottom(true), 10);

    try {
      if (!currentSessionId) {
        const sessionRes = await api.post("/chat/sessions", {});
        currentSessionId = sessionRes.data.id;
        router.replace(`/dashboard?sessionId=${currentSessionId}`);
      }

      const token = Cookies.get("token");
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      streamBufferRef.current = "";

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/chat/${currentSessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageContent,
          project_id: selectedProjectId,
        }),
        signal: abortController.signal,
      });

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      const flushInterval = setInterval(() => {
        setMessages((prev) => {
          const newMsgs = [...prev];
          const lastIndex = newMsgs.length - 1;
          if (newMsgs[lastIndex].role === "assistant") {
             if (newMsgs[lastIndex].content !== streamBufferRef.current) {
                newMsgs[lastIndex] = { ...newMsgs[lastIndex], content: streamBufferRef.current };
             }
          }
          return newMsgs;
        });
        scrollToBottom(true);
      }, 75);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) streamBufferRef.current += decoder.decode(value, { stream: true });
      }
      clearInterval(flushInterval);
      
      setMessages((prev) => {
        const newMsgs = [...prev];
        const lastIndex = newMsgs.length - 1;
        if (newMsgs[lastIndex].role === "assistant") {
           newMsgs[lastIndex] = { ...newMsgs[lastIndex], content: streamBufferRef.current };
        }
        return newMsgs;
      });

    } catch (error: any) {
      if (error.name !== "AbortError") {
        toast.error("Failed to generate");
        setMessages((prev) => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { role: "assistant", content: "**Error:** Could not connect." };
            return newMsgs;
        });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background w-full relative">
      
      <NoteCreator
        isOpen={isCreatorOpen}
        onOpenChange={setIsCreatorOpen}
        initialData={capturedCode ? {
            title: "Captured Snippet",
            code_snippet: capturedCode.code,
            language: capturedCode.lang,
            project_id: selectedProjectId || undefined
        } : null}
        defaultTab="manual"
        mode="manual"
        onSuccess={() => setIsCreatorOpen(false)}
      />

      <Dialog open={isNotePickerOpen} onOpenChange={setIsNotePickerOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/50">
            <div className="p-4 border-b border-border/50 bg-muted/20">
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" /> Select Note to Import
                    </DialogTitle>
                </DialogHeader>
                <Input 
                    placeholder="Search notes..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-3 h-9 bg-background border-border/50"
                />
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
                {availableNotes.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase())).map((note) => (
                    <button 
                        key={note.id} 
                        onClick={() => handleImportNote(note)}
                        className="w-full text-left p-3 hover:bg-secondary/50 rounded-lg group transition-colors flex items-center justify-between border border-transparent hover:border-border/30"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-primary/10 rounded-md text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Code2 className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                                <p className="text-sm font-medium truncate">{note.title}</p>
                                <p className="text-xs text-muted-foreground truncate opacity-70">{note.language}</p>
                            </div>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                ))}
                {availableNotes.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">No notes found in library.</div>
                )}
            </div>
        </DialogContent>
      </Dialog>

      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 px-2 md:px-4 min-h-0 overflow-y-auto custom-scrollbar pt-4"
        style={{ scrollBehavior: "auto" }}
      >
        {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full px-4 pb-20 animate-in fade-in duration-500">
                <div className="max-w-3xl w-full space-y-6 md:space-y-8 text-center">
                    
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-primary">
                            {greeting}, Ian
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground/80 font-light">
                            {subGreeting}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-3 pt-2 md:pt-4 text-left w-full">
                        {activeSuggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSuggestionClick(s.text)}
                                className={cn(
                                    "flex items-center gap-3 p-3 md:p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all duration-200 group relative overflow-hidden",
                                    "hover:border-primary/20 h-full"
                                )}
                            >
                                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                                    <s.icon className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <span className="font-medium text-xs md:text-sm text-foreground/80 group-hover:text-foreground truncate">
                                    {s.label}
                                </span>
                                <ArrowRight className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-muted-foreground hidden md:block" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <div className="max-w-3xl mx-auto w-full py-4 md:py-8 px-2 md:px-4 flex flex-col gap-4">
                {messages.map((msg, i) => (
                    <MessageBubble
                        key={i}
                        role={msg.role}
                        content={msg.content}
                        loading={loading && i === messages.length - 1}
                        onSaveCode={handleSaveCode}
                        // 🚀 PASS isLast PROP
                        isLast={i === messages.length - 1}
                    />
                ))}
                <div ref={messagesEndRef} className="h-2" />
            </div>
        )}
      </div>

      <div className="w-full p-2 pb-4 md:p-4 md:pb-6 z-10">
        <div className="max-w-3xl mx-auto w-full relative">
            
            <div className="relative flex items-end w-full gap-2 bg-background/80 backdrop-blur-sm p-1.5 rounded-3xl border border-border/60 shadow-sm transition-all focus-within:shadow-md focus-within:border-primary/20">
                
                <Popover open={isToolsOpen} onOpenChange={setIsToolsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 shrink-0 transition-all ml-1 mb-0.5"
                      title="Add Context"
                    >
                      <Plus className={cn("w-6 h-6 transition-transform duration-200", isToolsOpen && "rotate-45")} />
                    </Button>
                  </PopoverTrigger>
                  
                  <PopoverContent align="start" className="w-64 p-2 rounded-2xl border-border bg-popover text-popover-foreground shadow-xl" side="top" sideOffset={12}>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <p className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Project Context
                            </p>
                            <ProjectSelector
                                currentProjectId={selectedProjectId}
                                onProjectSelect={(id) => setSelectedProjectId(id)}
                            />
                        </div>
                        <div className="h-px bg-border/50 mx-1" />
                        <div className="space-y-1">
                             <p className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Actions
                            </p>
                            
                            <NoteCreator
                                currentProjectId={selectedProjectId}
                                defaultTab="manual"
                                mode="manual"
                                onSuccess={() => setIsToolsOpen(false)}
                                trigger={
                                  <button className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent/80 text-left transition-colors text-foreground/80 hover:text-foreground group">
                                    <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <FileText className="w-3.5 h-3.5" />
                                    </div>
                                    <span>Create Note</span>
                                  </button>
                                }
                            />
                            
                            <button 
                                onClick={handleOpenNotePicker}
                                className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent/80 text-left transition-colors text-foreground/80 hover:text-foreground group"
                            >
                                <div className="p-1.5 rounded-md bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                    <BookOpen className="w-3.5 h-3.5" />
                                </div>
                                <span>Import from Studio</span>
                            </button>

                            <NoteCreator
                                currentProjectId={selectedProjectId}
                                defaultTab="url"
                                mode="url"
                                onSuccess={handleUrlImportSuccess} 
                                importMode="chat"
                                trigger={
                                  <button className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent/80 text-left transition-colors text-foreground/80 hover:text-foreground group">
                                    <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                        <Globe className="w-3.5 h-3.5" />
                                    </div>
                                    <span>Import URL</span>
                                  </button>
                                }
                            />
                        </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedProjectId ? "Ask about this project..." : "Ask anything..."}
                    className="flex-1 min-h-[44px] max-h-32 bg-transparent border-none focus-visible:ring-0 text-base shadow-none px-2 py-3 placeholder:text-muted-foreground/50 resize-none"
                    disabled={loading}
                    rows={1}
                />

                <div className="pr-1 pb-0.5">
                    {loading ? (
                        <Button onClick={handleStop} size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-destructive/10 text-destructive">
                            <StopCircle className="w-6 h-6" />
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleSend} 
                            disabled={!input.trim()}
                            size="icon" 
                            className={cn(
                                "h-10 w-10 rounded-full transition-all duration-300",
                                input.trim() ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" : "bg-transparent text-muted-foreground hover:bg-secondary/80"
                            )}
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </div>
            
            <p className="text-center text-[10px] text-muted-foreground mt-3 font-medium opacity-60">
                KodaSync AI can make mistakes. Please verify important code.
            </p>
        </div>
      </div>
    </div>
  );
}