"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "bot";
  content: string;
  sources?: string[];
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Hello! I am connected to your Second Brain. Ask me anything about your saved code." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const token = Cookies.get("token");
      const response = await axios.post(
        "http://localhost:8000/notes/chat/",
        { message: userMsg },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => [
        ...prev,
        { 
          role: "bot", 
          content: response.data.reply,
          sources: response.data.sources 
        }
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "bot", content: "⚠️ Error: Could not reach the Neural Network." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 h-[600px] flex flex-col overflow-hidden">
      {/* CHAT AREA */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* AVATAR */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === "user" ? "bg-blue-600" : "bg-green-600"
            }`}>
              {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* MESSAGE BUBBLE */}
            <div className={`max-w-[80%] p-3 rounded-lg text-sm leading-relaxed ${
              msg.role === "user" 
                ? "bg-blue-600/20 text-blue-100 border border-blue-600/30" 
                : "bg-zinc-800 text-zinc-100 border border-zinc-700"
            }`}>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              
              {/* SOURCES (CITATIONS) */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-700/50 text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-400">Sources: </span>
                  {msg.sources.join(", ")}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center animate-pulse">
               <Bot size={16} />
            </div>
            <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-700 text-zinc-400 text-sm">
              Thinking...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </CardContent>

      {/* INPUT AREA */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex gap-2">
        <Input 
          placeholder="Ask about your code..."
          className="bg-zinc-900 border-zinc-700 text-white"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button 
          onClick={handleSend} 
          disabled={loading}
          className="bg-white text-black hover:bg-zinc-200"
        >
          <Send size={18} />
        </Button>
      </div>
    </Card>
  );
}