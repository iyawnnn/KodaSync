"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Editor from "@monaco-editor/react";
import { Wand2, Save, Loader2, ShieldCheck, FileText, Zap, TestTube, ArrowLeft } from "lucide-react";

interface NoteData {
  id?: string;
  title: string;
  code_snippet: string;
  language: string;
  tags?: string;
  project_id?: string; // <--- Added
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
  // New State for Projects
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [lastNote, setLastNote] = useState<any>(null);
  const [aiOutput, setAiOutput] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
    if (initialData) {
      setTitle(initialData.title);
      setCode(initialData.code_snippet);
      setLanguage(initialData.language || "javascript");
      setSelectedProjectId(initialData.project_id || "");
      setLastNote(initialData);
    }
  }, [initialData]);

  const fetchProjects = async () => {
    try {
      const token = Cookies.get("token");
      const res = await axios.get("http://localhost:8000/projects/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data);
    } catch (e) {
      console.error("Failed to load projects");
    }
  };

  const handleAiAction = async (action: string) => {
    if (!code) return alert("Write some code first!");
    setFixing(true);
    setAiOutput(null);
    try {
      const token = Cookies.get("token");
      const response = await axios.post(
        "http://localhost:8000/notes/fix/",
        { code_snippet: code, language: language, action: action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAiOutput(response.data.fixed_code);
    } catch (error) {
      alert("AI could not process request.");
    } finally {
      setFixing(false);
    }
  };

  const handleApplyAi = () => {
    if (aiOutput) {
      setCode(aiOutput);
      setAiOutput(null);
    }
  };

  const handleSave = async () => {
    if (!title || !code) return alert("Please fill in both fields");
    setLoading(true);
    const token = Cookies.get("token");

    try {
      const payload = { 
        title, 
        code_snippet: code, 
        language, 
        project_id: selectedProjectId || null // <--- Send Project ID
      };

      let response;
      if (initialData?.id) {
        response = await axios.put(
          `http://localhost:8000/notes/${initialData.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          "http://localhost:8000/notes/",
          payload,
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
      alert("Error saving note.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* INPUT COLUMN */}
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
              placeholder="e.g. Auth Middleware"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-600 outline-none"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="php">PHP</option>
                <option value="sql">SQL</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
              </select>
            </div>

            {/* --- NEW PROJECT DROPDOWN --- */}
            <div className="space-y-2">
              <Label>Project (Optional)</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-600 outline-none"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="">No Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <Label>Code</Label>
              <div className="flex gap-1 bg-zinc-800/50 p-1 rounded-md border border-zinc-800">
                <Button variant="ghost" size="icon" title="Auto-Fix Bug" onClick={() => handleAiAction("fix")} disabled={fixing} className="h-7 w-7 text-yellow-400 hover:bg-yellow-400/10">
                  {fixing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                </Button>
                <Button variant="ghost" size="icon" title="Secure Code" onClick={() => handleAiAction("secure")} disabled={fixing} className="h-7 w-7 text-green-400 hover:bg-green-400/10">
                  <ShieldCheck className="w-3 h-3"/>
                </Button>
                <Button variant="ghost" size="icon" title="Generate Docs" onClick={() => handleAiAction("document")} disabled={fixing} className="h-7 w-7 text-blue-400 hover:bg-blue-400/10">
                  <FileText className="w-3 h-3"/>
                </Button>
                <Button variant="ghost" size="icon" title="Optimize" onClick={() => handleAiAction("optimize")} disabled={fixing} className="h-7 w-7 text-purple-400 hover:bg-purple-400/10">
                  <Zap className="w-3 h-3"/>
                </Button>
                <Button variant="ghost" size="icon" title="Generate Tests" onClick={() => handleAiAction("test")} disabled={fixing} className="h-7 w-7 text-orange-400 hover:bg-orange-400/10">
                  <TestTube className="w-3 h-3"/>
                </Button>
              </div>
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
          
          <Button onClick={handleSave} disabled={loading} className="w-full bg-white text-black hover:bg-zinc-200">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
            {initialData ? "Update Memory" : "Save to Brain"}
          </Button>
        </CardContent>
      </Card>

      {/* OUTPUT COLUMN */}
      <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{aiOutput ? "✨ AI Result" : "Analysis Output"}</CardTitle>
          {aiOutput && (
            <Button size="sm" variant="outline" onClick={() => setAiOutput(null)} className="h-8 border-zinc-700 hover:bg-zinc-800">
              Clear
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {aiOutput ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-3 bg-zinc-950/50 rounded-md border border-green-900/30">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-green-400">Suggested Code</Label>
                  <Button size="sm" onClick={handleApplyAi} className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs">
                    <ArrowLeft className="w-3 h-3 mr-1" /> Apply to Editor
                  </Button>
                </div>
                <div className="border border-zinc-700 rounded-md overflow-hidden">
                  <Editor
                    height="300px"
                    theme="vs-dark"
                    language={language}
                    value={aiOutput}
                    options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }}
                  />
                </div>
              </div>
            </div>
          ) : lastNote ? (
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
                    language={lastNote.language || "javascript"}
                    value={lastNote.code_snippet}
                    options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[400px] items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-md">
              <div className="text-center space-y-2">
                <Wand2 className="w-8 h-8 mx-auto opacity-50" />
                <p>Run an AI action to see results here.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}