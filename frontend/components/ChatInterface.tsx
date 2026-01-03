"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User as UserIcon, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ChatInterface({ sessionId }: { sessionId?: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-Scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (sessionId) loadHistory(sessionId);
    else setMessages([]); 
  }, [sessionId]);

  const loadHistory = async (id: string) => {
    try {
      const token = Cookies.get("token");
      const res = await axios.get(`http://localhost:8000/chat/sessions/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (e) { console.error("Failed to load history"); }
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const token = Cookies.get("token");
      const res = await axios.post(
        `http://localhost:8000/chat/${sessionId}`,
        { message: userMsg.content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: Could not reach AI." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-zinc-500 space-y-4">
        <Bot className="w-16 h-16 opacity-20" />
        <p>Select a conversation from the sidebar to start.</p>
      </div>
    );
  }

  return (
    // FIX: h-full allows the parent container (Dashboard) to control height
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg border border-zinc-800 shadow-xl overflow-hidden">
      
      {/* MESSAGE AREA */}
      <ScrollArea className="flex-1 px-6">
        <div className="flex flex-col gap-6 py-6 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                
                {/* AVATAR */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-1 ${
                  msg.role === "user" ? "bg-blue-600 border-blue-500" : "bg-zinc-800 border-zinc-700"
                }`}>
                  {msg.role === "user" ? <UserIcon className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-green-400" />}
                </div>

                {/* BUBBLE */}
                <div className={`p-4 rounded-xl text-sm shadow-sm ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700"
                }`}>
                   <ReactMarkdown
                      components={{
                        p({children}) { return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p> },
                        code({node, inline, className, children, ...props}: any) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <div className="rounded-md overflow-hidden my-3 border border-zinc-950 shadow-md">
                                <div className="bg-zinc-950 px-3 py-1.5 text-xs text-zinc-500 font-mono border-b border-zinc-900 flex justify-between">
                                    <span className="uppercase">{match[1]}</span>
                                </div>
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{ margin: 0, padding: '1rem', fontSize: '13px' }}
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className="bg-black/30 px-1.5 py-0.5 rounded text-amber-300 font-mono text-xs" {...props}>
                              {children}
                            </code>
                          )
                        }
                      }}
                   >
                     {msg.content}
                   </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start w-full">
              <div className="flex gap-3 max-w-[85%]">
                 <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-zinc-800 border border-zinc-700 mt-1">
                    <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                 </div>
                 <div className="bg-zinc-800 p-3 rounded-xl rounded-tl-none border border-zinc-700 text-xs text-zinc-400">
                    KodaSync is thinking...
                 </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* INPUT AREA */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800">
        <div className="flex gap-2">
            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..." 
              className="bg-zinc-900 border-zinc-800 text-zinc-200 focus-visible:ring-blue-600"
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Send className="w-4 h-4" />
            </Button>
        </div>
      </div>
    </div>
  );
}