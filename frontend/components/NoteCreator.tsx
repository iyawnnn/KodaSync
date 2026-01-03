"use client";

import { useState, useEffect, ReactNode } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Editor from "@monaco-editor/react";
import {
  Wand2,
  Save,
  Loader2,
  FileText,
  ArrowLeft,
  Globe,
  Link as LinkIcon,
  Plus
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface NoteData {
  id?: string;
  title: string;
  code_snippet: string;
  language: string;
  tags?: string;
  project_id?: string;
}

export default function NoteCreator({
  initialData,
  onSuccess,
  currentProjectId,
  trigger, // If provided, renders as Modal. If null, renders Inline Fixed.
  defaultTab = "manual",
}: {
  initialData?: NoteData | null;
  onSuccess?: () => void;
  currentProjectId?: string | null;
  trigger?: ReactNode; 
  defaultTab?: "manual" | "url";
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Form State
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [url, setUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [lastNote, setLastNote] = useState<any>(null);
  const [aiOutput, setAiOutput] = useState<string | null>(null);

  const isModal = !!trigger; // Detect Mode

  useEffect(() => {
    fetchProjects();
    if (currentProjectId) setSelectedProjectId(currentProjectId);
  }, [currentProjectId]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCode(initialData.code_snippet);
      setLanguage(initialData.language || "javascript");
      setSelectedProjectId(initialData.project_id || "");
      setLastNote(initialData);
    }
  }, [initialData]);

  // Reset tab when dialog opens
  useEffect(() => {
    if (open) setActiveTab(defaultTab);
  }, [open, defaultTab]);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects/");
      setProjects(res.data);
    } catch (e) {
      console.error("Failed to load projects");
    }
  };

  const handleAiAction = async (action: string) => {
    if (!code) {
      toast.error("Please write some code first!");
      return;
    }
    setFixing(true);
    setAiOutput(null);
    try {
      const response = await api.post("/notes/fix/", {
        code_snippet: code,
        language: language,
        action: action,
      });
      setAiOutput(response.data.fixed_code);
      toast.success("AI Analysis Complete");
    } catch (error) {
      toast.error("AI could not process request.");
    } finally {
      setFixing(false);
    }
  };

  const handleApplyAi = () => {
    if (aiOutput) {
      setCode(aiOutput);
      setAiOutput(null);
      toast.info("Code updated");
    }
  };

  const handleSave = async () => {
    if (!title || !code) {
      toast.warning("Title and Code required.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title,
        code_snippet: code,
        language,
        project_id: selectedProjectId || null,
      };

      let response;
      if (initialData?.id) {
        response = await api.put(`/notes/${initialData.id}`, payload);
        toast.success("Updated successfully");
      } else {
        response = await api.post("/notes/", payload);
        toast.success("Saved to Brain!");
      }
      setLastNote(response.data);
      
      if (!initialData?.id) {
        setTitle("");
        setCode("");
      }
      if (onSuccess) onSuccess();
      if (isModal) setOpen(false);
    } catch (error) {
      toast.error("Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportUrl = async () => {
    if (!url.trim()) return toast.error("URL is required");
    setLoading(true);
    try {
      const res = await api.post("/notes/import-url", {
        url,
        project_id: selectedProjectId || null,
      });
      setLastNote(res.data);
      toast.success("Scraped & Memorized!");
      setUrl("");
      if (onSuccess) onSuccess();
      if (isModal) setOpen(false);
    } catch (e) {
      toast.error("Failed to import URL");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER CONTENT (Shared) ---
  const Content = (
    <div className={`space-y-4 ${!isModal && "h-full"}`}>
      {/* Project Selector */}
      <div className={`${isModal ? "bg-zinc-900/50 p-3 rounded-lg border border-zinc-800" : "mb-4"}`}>
         {isModal && <Label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Project Context</Label>}
         <select
            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-600 outline-none"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
        >
            <option value="">Global (No Project)</option>
            {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
            ))}
        </select>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-950 border border-zinc-800 mb-4">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="url">Import from URL</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4 mt-0">
             <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-zinc-800 border-zinc-700" />
            </div>
            
            <div className="space-y-2">
                <Label>Language</Label>
                <select
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-600 outline-none"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="bash">Bash</option>
                    <option value="sql">SQL</option>
                    <option value="json">JSON</option>
                </select>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                    <Label>Code</Label>
                    <div className="flex gap-1 bg-zinc-800/50 p-1 rounded-md border border-zinc-800">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-yellow-400" onClick={() => handleAiAction("fix")} disabled={fixing}>
                            {fixing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-400" onClick={() => handleAiAction("document")} disabled={fixing}>
                            <FileText className="w-3 h-3"/>
                        </Button>
                    </div>
                </div>
                <div className="border border-zinc-700 rounded-md overflow-hidden">
                    <Editor
                        height={isModal ? "250px" : "300px"}
                        theme="vs-dark"
                        language={language}
                        value={code}
                        onChange={(v) => setCode(v || "")}
                        options={{ minimap: { enabled: false }, fontSize: 13 }}
                    />
                </div>
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 h-10">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {initialData ? "Update" : "Save Note"}
            </Button>
        </TabsContent>

        <TabsContent value="url" className="mt-0 py-4 space-y-4">
             <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-800 rounded-lg bg-zinc-900/30">
                <Globe className="w-12 h-12 text-zinc-600 mb-4" />
                <p className="text-sm text-zinc-400 text-center mb-6 max-w-xs">Paste a GitHub or Docs URL.</p>
                <div className="relative w-full">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input value={url} onChange={(e) => setUrl(e.target.value)} className="pl-10 bg-zinc-950 border-zinc-700" placeholder="https://..." />
                </div>
            </div>
            <Button onClick={handleImportUrl} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 h-10">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Scrape & Memorize
            </Button>
        </TabsContent>
      </Tabs>
    </div>
  );

  // --- OUTPUT CONTENT (For Inline Grid) ---
  const OutputPanel = (
    <Card className="border-zinc-800 bg-zinc-900 text-zinc-100 h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
             {aiOutput ? "✨ AI Suggestion" : (lastNote ? "Last Saved Note" : "AI Output")}
          </CardTitle>
          {aiOutput && (
            <Button size="sm" variant="outline" onClick={() => setAiOutput(null)} className="h-7 border-zinc-700">Clear</Button>
          )}
        </CardHeader>
        <CardContent>
          {aiOutput ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-zinc-950/50 rounded-md border border-green-900/30">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-green-400 text-xs">AI Fix</Label>
                  <Button size="sm" onClick={handleApplyAi} className="h-6 bg-green-600 hover:bg-green-700 text-white text-xs">
                    <ArrowLeft className="w-3 h-3 mr-1" /> Apply
                  </Button>
                </div>
                <div className="border border-zinc-700 rounded-md overflow-hidden">
                  <Editor height="300px" theme="vs-dark" language={language} value={aiOutput} options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }} />
                </div>
              </div>
            </div>
          ) : lastNote ? (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <Label className="text-zinc-400 text-xs">Title</Label>
                <div className="font-bold text-white truncate">{lastNote.title}</div>
              </div>
              <div className="mt-2 border border-zinc-700 rounded-md overflow-hidden">
                   <Editor height="200px" theme="vs-dark" language={lastNote.language || "javascript"} value={lastNote.code_snippet} options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }} />
              </div>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-md">
              <div className="text-center space-y-2">
                <Wand2 className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs">Run AI tools to see results here.</p>
              </div>
            </div>
          )}
        </CardContent>
    </Card>
  );

  // 1. MODAL MODE (Used in Chat)
  if (isModal) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-6">
                <DialogTitle className="flex items-center gap-2 mb-4">
                    <Plus className="w-5 h-5 text-blue-500" />
                    Add Knowledge
                </DialogTitle>
                {Content}
                
                {/* Tiny Output Preview for Modal */}
                {aiOutput && (
                    <div className="mt-4 p-3 bg-zinc-900 border border-green-900/50 rounded-md">
                         <div className="flex justify-between items-center mb-2">
                            <Label className="text-green-400 text-xs">AI Suggestion</Label>
                            <Button size="sm" variant="ghost" className="h-6 text-xs text-green-400" onClick={handleApplyAi}>Apply</Button>
                        </div>
                        <Editor height="100px" theme="vs-dark" language={language} value={aiOutput} options={{ readOnly: true, minimap: { enabled: false } }} />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
  }

  // 2. INLINE MODE (Used in Dashboard - Restored Grid Layout)
  return (
    <div className="grid gap-6 md:grid-cols-2 h-full">
        {/* Left: Input */}
        <Card className="border-zinc-800 bg-zinc-900 text-zinc-100 h-full">
            <CardHeader>
                <CardTitle>{initialData ? "Edit Memory" : "New Code Snippet"}</CardTitle>
            </CardHeader>
            <CardContent>
                {Content}
            </CardContent>
        </Card>

        {/* Right: Output */}
        {OutputPanel}
    </div>
  );
}