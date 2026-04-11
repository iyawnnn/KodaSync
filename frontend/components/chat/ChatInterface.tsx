"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import Cookies from "js-cookie";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { 
  Send, StopCircle, Plus, Globe, Code2, Terminal, Cpu, Database, FileText, BookOpen
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
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTION_POOL = [
  { label: "Refactor Code", text: "Refactor this code to be more clean, efficient, and modern:", icon: Code2 },
  { label: "Debug Python", text: "Help me find and fix the bug in this Python script:", icon: Terminal },
  { label: "React Hook", text: "Write a custom React hook to handle form validation:", icon: Cpu },
  { label: "SQL Query", text: "Write an optimized SQL query to join these three tables:", icon: Database },
];

export default function ChatInterface({ sessionId }: { sessionId?: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false); // Prevents layout flashing
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Dynamic user name state
  const [userName, setUserName] = useState("Ian"); 
  const [greeting, setGreeting] = useState("Hello");
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
      setIsFetchingHistory(false);
    }
    return () => abortControllerRef.current?.abort();
  }, [sessionId]);

  const loadHistory = async (id: string) => {
    setIsFetchingHistory(true); // Lock layout to bottom during fetch
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
        setIsFetchingHistory(false);
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
    <div className="flex flex-col h-full bg-background w-full relative overflow-hidden">
      
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

{/* Main Scroll Area */}
      <div className={cn(
        "min-h-0 relative w-full",
        (messages.length === 0 && !isFetchingHistory) ? "hidden" : "flex-1 flex flex-col"
      )}>
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 h-full overflow-y-auto px-4 pt-8 pb-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] flex flex-col"
          style={{ scrollBehavior: "auto" }}
        >
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
              {messages.map((msg, i) => (
                  <MessageBubble
                      key={i}
                      role={msg.role}
                      content={msg.content}
                      loading={loading && i === messages.length - 1}
                      onSaveCode={handleSaveCode}
                      isLast={i === messages.length - 1}
                  />
              ))}
              <div ref={messagesEndRef} className="h-8" />
          </div>
        </div>
        
        {/* Opacity Mask / Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
      </div>

      {/* Animated Layout Wrapper for Empty State and Omnibar */}
      <motion.div 
        layout
        className={cn(
          "w-full px-4 flex flex-col",
          (messages.length === 0 && !isFetchingHistory) ? "flex-1 items-center justify-center" : "flex-none pb-6 pt-2 z-20 bg-background"
        )}
      >
        <AnimatePresence>
          {(messages.length === 0 && !isFetchingHistory) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl text-center mb-8 flex flex-col items-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary mb-3">
                  {greeting}, {userName}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10">
                  How can I help you code today?
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                  {activeSuggestions.map((s, i) => (
                      <button
                          key={i}
                          onClick={() => handleSuggestionClick(s.text)}
                          className="group flex items-center gap-2.5 px-5 py-3 rounded-full border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                          <s.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="font-medium text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                              {s.label}
                          </span>
                      </button>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div layout className="max-w-4xl mx-auto w-full relative">
          <div className="bg-card border border-border shadow-md rounded-[24px] p-2 flex items-end gap-2 transition-shadow focus-within:shadow-xl focus-within:border-primary/40">
              
              <Popover open={isToolsOpen} onOpenChange={setIsToolsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent shrink-0 transition-all ml-1 mb-1"
                    title="Add Context"
                  >
                    <Plus className={cn("w-5 h-5 transition-transform duration-200", isToolsOpen && "rotate-45")} />
                  </Button>
                </PopoverTrigger>
                
                <PopoverContent align="start" className="w-64 p-3 rounded-3xl border border-primary/20 bg-background shadow-2xl" side="top" sideOffset={12}>
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <p className="px-1 text-[11px] font-bold text-primary/60 uppercase tracking-widest">
                              Project Context
                          </p>
                          <ProjectSelector
                              currentProjectId={selectedProjectId}
                              onProjectSelect={(id) => setSelectedProjectId(id)}
                          />
                      </div>
                      <div className="h-px bg-primary/10 mx-1" />
                      <div className="space-y-1.5">
                           <p className="px-1 text-[11px] font-bold text-primary/60 uppercase tracking-widest mb-2">
                              Quick Actions
                          </p>
                          
                          <NoteCreator
                              currentProjectId={selectedProjectId}
                              defaultTab="manual"
                              mode="manual"
                              onSuccess={() => setIsToolsOpen(false)}
                              trigger={
                                <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-primary/10 text-left transition-all text-foreground/80 hover:text-primary group border border-transparent hover:border-primary/20">
                                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                                      <FileText className="w-4 h-4" />
                                  </div>
                                  <span>Create Note</span>
                                </button>
                              }
                          />
                          
                          <button 
                              onClick={handleOpenNotePicker}
                              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-primary/10 text-left transition-all text-foreground/80 hover:text-primary group border border-transparent hover:border-primary/20"
                          >
                              <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                                  <BookOpen className="w-4 h-4" />
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
                                <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-primary/10 text-left transition-all text-foreground/80 hover:text-primary group border border-transparent hover:border-primary/20">
                                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                                      <Globe className="w-4 h-4" />
                                  </div>
                                  <span>Import URL</span>
                                </button>
                              }
                          />
                      </div>
                  </div>
                </PopoverContent>
              </Popover>

              <TextareaAutosize
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedProjectId ? "Ask about this project..." : "Ask anything..."}
                  className="flex-1 min-h-[44px] max-h-48 bg-transparent border-none focus-visible:ring-0 text-base shadow-none px-2 py-3 placeholder:text-muted-foreground/50 resize-none outline-none"
                  disabled={loading}
                  minRows={1}
              />

              <div className="pr-1 pb-1">
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
                              input.trim() ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" : "bg-transparent text-muted-foreground hover:bg-secondary"
                          )}
                      >
                          <Send className="w-5 h-5" />
                      </Button>
                  )}
              </div>
          </div>
          
          <motion.p layout="position" className="text-center text-[10px] text-muted-foreground mt-3 font-medium opacity-60">
              KodaSync AI can make mistakes. Please verify important code.
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}