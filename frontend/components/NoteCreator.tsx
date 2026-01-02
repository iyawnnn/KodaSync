"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Editor from "@monaco-editor/react";
import { Wand2, Save, Loader2 } from "lucide-react"; // <--- New Icons

interface NoteData {
  id?: string;
  title: string;
  code_snippet: string;
  language: string;
  tags?: string;
}

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
  const [fixing, setFixing] = useState(false); // <--- New State for Fixer
  const [lastNote, setLastNote] = useState<any>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCode(initialData.code_snippet);
      setLanguage(initialData.language || "javascript");
      setLastNote(initialData);
    }
  }, [initialData]);

  // --- NEW: AUTO-FIX FUNCTION ---
  const handleFixCode = async () => {
    if (!code) return alert("Write some code first!");
    setFixing(true);
    try {
      const token = Cookies.get("token");
      const response = await axios.post(
        "http://localhost:8000/notes/fix/",
        { 
          code_snippet: code, 
          language: language 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the editor with the fixed code
      setCode(response.data.fixed_code);
      alert("✨ Code fixed by AI!");
    } catch (error) {
      console.error("Fix failed:", error);
      alert("Could not fix code.");
    } finally {
      setFixing(false);
    }
  };
  // ------------------------------

  const handleSave = async () => {
    if (!title || !code) return alert("Please fill in both fields");
    setLoading(true);
    const token = Cookies.get("token");

    try {
      let response;
      if (initialData?.id) {
        response = await axios.put(
          `http://localhost:8000/notes/${initialData.id}`,
          { title, code_snippet: code, language },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          "http://localhost:8000/notes/",
          { title, code_snippet: code, language },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setLastNote(response.data);
      if (!initialData?.id) {
        setTitle("");
        setCode("");
      }
      if (onSuccess) onSuccess();
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        alert("Session expired. Please log in again.");
        Cookies.remove("token");
        window.location.href = "/";
        return;
      }
      alert("Error saving note.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
        <CardHeader>
          <CardTitle>{initialData ? "Edit Memory" : "New Code Snippet"}</CardTitle>
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
            <div className="flex justify-between items-center">
              <Label>Code</Label>
              {/* --- NEW FIX BUTTON --- */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleFixCode}
                disabled={fixing}
                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 h-6 text-xs"
              >
                {fixing ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Wand2 className="w-3 h-3 mr-1"/>}
                {fixing ? "Fixing..." : "Auto-Fix"}
              </Button>
            </div>
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
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
            {initialData ? "Update Memory" : "Save to Brain"}
          </Button>
        </CardContent>
      </Card>

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
                <Label className="text-zinc-400">Detected Tags</Label>
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