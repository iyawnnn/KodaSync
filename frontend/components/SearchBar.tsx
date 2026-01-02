"use client";

import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import ReactMarkdown from "react-markdown"; // <--- NEW IMPORT
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SearchBarProps {
  onEdit: (note: any) => void;
}

export default function SearchBar({ onEdit }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // --- STATE FOR EXPLANATION ---
  const [explainOpen, setExplainOpen] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  // --------------------------------

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const token = Cookies.get("token");
      const response = await axios.get(
        `http://localhost:8000/notes/search/?q=${val}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this memory?")) return;
    try {
      const token = Cookies.get("token");
      await axios.delete(`http://localhost:8000/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(results.filter((note) => note.id !== id));
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const handleExplain = async (note: any) => {
    setExplainOpen(true);
    setExplanation(""); 
    setIsExplaining(true);

    try {
      const token = Cookies.get("token");
      const response = await axios.post(
        "http://localhost:8000/notes/explain/",
        {
          code_snippet: note.code_snippet,
          language: note.language || "javascript"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExplanation(response.data.explanation);
    } catch (err) {
      setExplanation("Failed to get explanation. The AI might be busy.");
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SEARCH INPUT */}
      <div className="relative">
        <Input
          placeholder="Search your brain..."
          className="bg-zinc-900 border-zinc-700 text-lg p-6"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {loading && (
          <div className="absolute right-4 top-4 text-zinc-500 text-sm animate-pulse">
            Searching...
          </div>
        )}
      </div>

      {/* 2. NOTE CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.map((note) => (
          <Card
            key={note.id}
            className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors group relative"
          >
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-blue-900/20 text-blue-400 border-blue-900 hover:bg-blue-900/50"
                onClick={() => handleExplain(note)}
              >
                Explain
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                className="h-7 text-xs bg-zinc-700 hover:bg-zinc-600 text-white"
                onClick={() => onEdit(note)}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleDelete(note.id)}
              >
                Delete
              </Button>
            </div>

            <CardHeader>
              <CardTitle className="text-white truncate pr-28">
                {note.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-zinc-500 mb-2 font-mono bg-black p-2 rounded truncate">
                {note.code_snippet}
              </div>
              <div className="flex flex-wrap gap-1">
                {note.tags?.split(",").slice(0, 3).map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-1 bg-zinc-800 text-zinc-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. EXPLANATION MODAL (UPDATED WITH MARKDOWN) */}
      <Dialog open={explainOpen} onOpenChange={setExplainOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-400">
              AI Tutor Analysis
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Breakdown of the selected code snippet.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {isExplaining ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 text-zinc-500 animate-pulse">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p>⚡ Connecting to Neural Network...</p>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mb-4 mt-6" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-blue-300 mb-3 mt-5" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-medium text-blue-200 mb-2 mt-4" {...props} />,
                    p: ({node, ...props}) => <p className="leading-7 mb-4" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />,
                    // Code Block Styling
                    code: ({node, className, children, ...props}: any) => {
                      const match = /language-(\w+)/.exec(className || '')
                      return !match ? (
                        <code className="bg-zinc-800 px-1 py-0.5 rounded text-yellow-300 font-mono text-sm" {...props}>
                          {children}
                        </code>
                      ) : (
                        <div className="my-4 rounded-md overflow-hidden border border-zinc-700">
                          <div className="bg-zinc-800 px-3 py-1 text-xs text-zinc-400 border-b border-zinc-700">
                            {match[1]}
                          </div>
                          <pre className="bg-zinc-950 p-4 overflow-x-auto">
                            <code className={`language-${match[1]} text-sm font-mono text-green-400`} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      )
                    }
                  }}
                >
                  {explanation}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}