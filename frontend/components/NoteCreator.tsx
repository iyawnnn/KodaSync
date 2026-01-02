"use client";

import { useState, useEffect } from "react"; // <--- Added useEffect
import axios from "axios";
import Cookies from "js-cookie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Editor from "@monaco-editor/react";

// Define what a Note looks like
interface NoteData {
  id?: string;
  title: string;
  code_snippet: string;
  language: string;
  tags?: string;
}

// Accept props to support "Edit Mode"
export default function NoteCreator({ 
  initialData, 
  onSuccess 
}: { 
  initialData?: NoteData | null, 
  onSuccess?: () => void 
}) {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [loading, setLoading] = useState(false);
  const [lastNote, setLastNote] = useState<any>(null);

  // Load data if we are editing
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCode(initialData.code_snippet);
      setLanguage(initialData.language || "javascript");
      setLastNote(initialData); // Show the current state immediately
    }
  }, [initialData]);

  const handleSave = async () => {
    if (!title || !code) return alert("Please fill in both fields");
    
    setLoading(true);
    const token = Cookies.get("token");

    try {
      let response;
      
      // DECIDE: Create (POST) or Update (PUT)?
      if (initialData?.id) {
        // --- UPDATE MODE ---
        response = await axios.put(
          `http://localhost:8000/notes/${initialData.id}`,
          { title, code_snippet: code, language },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // --- CREATE MODE ---
        response = await axios.post(
          "http://localhost:8000/notes/",
          { title, code_snippet: code, language },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setLastNote(response.data);
      
      // Only clear if we created a NEW note. 
      // If editing, we usually want to keep looking at it.
      if (!initialData?.id) {
        setTitle("");
        setCode("");
      }
      
      if (onSuccess) onSuccess(); // Tell parent component we are done
      
    } catch (error) {
      console.error("Failed to save note:", error);
      alert("Error saving note. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* LEFT: The Form */}
      <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
        <CardHeader>
          <CardTitle>
            {initialData ? "Edit Memory" : "New Code Snippet"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="sql">SQL</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Code</Label>
            <div className="border border-zinc-700 rounded-md overflow-hidden">
              <Editor
                height="300px"
                theme="vs-dark"
                defaultLanguage="javascript"
                language={language}
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{ minimap: { enabled: false }, fontSize: 14 }}
              />
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full bg-white text-black hover:bg-zinc-200"
          >
            {loading ? "AI is Thinking..." : (initialData ? "Update Memory" : "Save to Brain")}
          </Button>
        </CardContent>
      </Card>

      {/* RIGHT: The AI Result */}
      <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
        <CardHeader>
          <CardTitle>AI Analysis Output</CardTitle>
        </CardHeader>
        <CardContent>
          {!lastNote ? (
            <div className="flex h-[400px] items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-md">
              Waiting for input...
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div>
                <Label className="text-zinc-400">Title</Label>
                <div className="text-xl font-bold text-white">{lastNote.title}</div>
              </div>
              <div>
                <Label className="text-zinc-400">Detected Tags (By Groq)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {lastNote.tags?.split(",").map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-blue-900 text-blue-100 text-xs rounded-full border border-blue-700">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-zinc-400">Snippet Preview</Label>
                <div className="mt-2 border border-zinc-700 rounded-md overflow-hidden">
                   <Editor
                    height="200px"
                    theme="vs-dark"
                    defaultLanguage="javascript"
                    language={lastNote.language || "javascript"}
                    value={lastNote.code_snippet}
                    options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}