"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api"; 
import Cookies from "js-cookie"; 
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot, StopCircle, Sparkles, Plus, Globe } from "lucide-react"; 
import { toast } from "sonner";
import MessageBubble from "./MessageBubble"; 
import ProjectSelector from "./ProjectSelector"; 
import NoteCreator from "./NoteCreator"; 

export default function ChatInterface({ sessionId }: { sessionId?: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamBufferRef = useRef(""); 
  const isAtBottomRef = useRef(true); 

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isBottom = scrollHeight - scrollTop - clientHeight < 150;
    isAtBottomRef.current = isBottom;
  };

  const scrollToBottom = (instant = false) => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: instant ? "instant" : "smooth" });
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadHistory(sessionId);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    } else {
      setMessages([]); 
    }
  }, [sessionId]);

  const loadHistory = async (id: string) => {
    try {
      const res = await api.get(`/chat/sessions/${id}/messages`);
      setMessages(res.data);
      setTimeout(() => {
        isAtBottomRef.current = true;
        scrollToBottom(true);
      }, 100);
    } catch (e) { console.error("Failed to load history"); }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      toast.info("Generation stopped");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;
    
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    
    isAtBottomRef.current = true;
    setTimeout(() => scrollToBottom(true), 10);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const token = Cookies.get("token");
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    streamBufferRef.current = "";

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await fetch(`${API_URL}/chat/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ 
            message: userMsg.content,
            project_id: selectedProjectId 
        }),
        signal: abortController.signal
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
        if (value) { streamBufferRef.current += decoder.decode(value, { stream: true }); }
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
        toast.error("Failed to generate response");
        setMessages((prev) => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { role: "assistant", content: "**Error:** Could not reach AI." };
            return newMsgs;
        });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  if (!sessionId) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-zinc-500 space-y-4">
        <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center border border-zinc-800 shadow-xl">
            <Bot className="w-12 h-12 opacity-50 text-blue-500" />
        </div>
        <p className="font-medium">Select a conversation to start coding.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden relative">
      
      {/* HEADER BAR */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-sm z-20">
         <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-zinc-200">AI Chat</span>
         </div>

         <div className="flex items-center gap-2">
            {/* 🚀 FIXED: Passed a Trigger Button so it opens as a Modal */}
            <NoteCreator 
              currentProjectId={selectedProjectId} 
              defaultTab="manual"
              trigger={
                <Button size="sm" variant="outline" className="h-8 border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 gap-2">
                    <Plus className="w-3 h-3" /> Add Note
                </Button>
              }
            />
            
            <ProjectSelector 
                currentProjectId={selectedProjectId} 
                onProjectSelect={setSelectedProjectId} 
            />
         </div>
      </div>

      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 px-4 min-h-0 overflow-y-auto custom-scrollbar"
        style={{ scrollBehavior: "auto" }}
      >
        <div className="flex flex-col py-8 pb-4 pr-2">
            {messages.map((msg, i) => (
              <MessageBubble 
                key={i} 
                role={msg.role} 
                content={msg.content} 
                loading={loading && i === messages.length - 1} 
              />
            ))}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* INPUT AREA with TOOLS */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-900 z-10">
        <div className="flex gap-2 max-w-4xl mx-auto">
            {/* 🚀 TOOL: Import URL (Bottom Left) */}
            <NoteCreator 
              currentProjectId={selectedProjectId}
              defaultTab="url"
              trigger={
                <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 shadow-lg" title="Import Documentation/Repo">
                    <Globe className="w-5 h-5" />
                </Button>
              }
            />

            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
              placeholder={selectedProjectId ? "Ask about this project..." : "Ask anything (Global)..."} 
              className="bg-zinc-900 border-zinc-800 text-zinc-200 focus-visible:ring-blue-600 h-11 shadow-inner rounded-xl"
              disabled={loading}
            />
            {loading ? (
              <Button onClick={handleStop} variant="destructive" className="w-12 h-11 px-0 hover:bg-red-900 rounded-xl shadow-lg">
                 <StopCircle className="w-5 h-5" />
              </Button>
            ) : (
              <Button onClick={handleSend} disabled={!input.trim()} className="bg-blue-600 hover:bg-blue-500 text-white h-11 px-5 rounded-xl shadow-lg transition-all active:scale-95">
                <Send className="w-5 h-5" />
              </Button>
            )}
        </div>
      </div>
    </div>
  );
}