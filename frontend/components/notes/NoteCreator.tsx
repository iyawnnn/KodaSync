"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Editor from "@monaco-editor/react";
import {
  Wand2, Save, Loader2, FileText, Globe, PenTool, Code, Check, Sparkles, Terminal, ShieldCheck, FlaskConical, FileJson, X, Info
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import UrlImportForm from "./UrlImportForm";

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
  trigger,
  defaultTab = "manual",
  mode = "full",
  isOpen,
  onOpenChange,
  // 🚀 NEW PROP
  importMode = "save" 
}: {
  initialData?: NoteData | null;
  onSuccess?: (data?: any) => void; // Update type to accept data
  currentProjectId?: string | null;
  trigger?: ReactNode; 
  defaultTab?: "manual" | "url";
  mode?: "full" | "manual" | "url";
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  importMode?: "save" | "chat";
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("global");

  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  
  const [lastNote, setLastNote] = useState<any>(null);
  const [aiCode, setAiCode] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const aiOutputRef = useRef<HTMLDivElement>(null);
  const isModal = !!trigger || isControlled;

  useEffect(() => {
    fetchProjects();
    if (currentProjectId) setSelectedProjectId(currentProjectId);
  }, [currentProjectId]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCode(initialData.code_snippet);
      setLanguage(initialData.language || "javascript");
      setSelectedProjectId(initialData.project_id || "global");
      setLastNote(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    if (open) {
        if (mode === 'url') setActiveTab('url');
        else if (mode === 'manual') setActiveTab('manual');
        else setActiveTab(defaultTab);
    }
  }, [open, defaultTab, mode]);

  useEffect(() => {
    if (aiCode && aiOutputRef.current) {
        aiOutputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [aiCode]);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects/");
      setProjects(res.data);
    } catch (e) { }
  };

  const cleanAiResponse = (response: string) => {
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/;
    const match = response.match(codeBlockRegex);
    if (match) {
      return {
        code: match[1].trim(),
        explanation: response.replace(codeBlockRegex, "").trim()
      };
    }
    return { code: response, explanation: "" }; 
  };

  const handleAiAction = async (action: string) => {
    if (!code) return toast.error("Please write some code first!");
    
    setFixing(true);
    setActiveAction(action);
    setAiCode(null);
    setAiExplanation(null);

    try {
      const response = await api.post("/notes/fix/", {
        code_snippet: code,
        language: language,
        action: action, 
      });
      
      const rawOutput = response.data.fixed_code;
      const { code: cleanCode, explanation } = cleanAiResponse(rawOutput);

      setAiCode(cleanCode);
      if (explanation) setAiExplanation(explanation);
      
      toast.success(`AI ${action} complete`);
    } catch (error) {
      toast.error("AI could not process request.");
    } finally {
      setFixing(false);
      setActiveAction(null);
    }
  };

  const handleApplyAi = () => {
    if (aiCode) {
      setCode(aiCode);
      setAiCode(null);
      setAiExplanation(null);
      toast.success("Code updated successfully!");
    }
  };

  const handleSave = async () => {
    if (!title || !code) return toast.warning("Title and Code required.");
    
    setLoading(true);
    try {
      const payload = {
        title,
        code_snippet: code,
        language,
        project_id: selectedProjectId === "global" ? null : selectedProjectId,
      };

      if (initialData?.id) {
        await api.put(`/notes/${initialData.id}`, payload);
        toast.success("Updated successfully");
      } else {
        const res = await api.post("/notes/", payload);
        setLastNote(res.data);
        toast.success("Saved to Brain!");
      }
      
      if (!initialData?.id) { setTitle(""); setCode(""); }
      if (onSuccess) onSuccess();
      if (isModal) setOpen(false);
    } catch (error) {
      toast.error("Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSuccess = (data: any) => {
      setLastNote(data);
      // 🚀 Pass data back to onSuccess so parent can use it (e.g. ChatInterface)
      if (onSuccess) onSuccess(data); 
      if (isModal) setOpen(false);
  }

  // ... (Components like CustomSelect, ManualForm, etc. remain the same) ...
  // To save space, I'm focusing on where the props are passed.

  const CustomSelect = ({ value, onChange, placeholder, options, icon: Icon }: any) => (
    <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-secondary/50 h-10 border-transparent focus:ring-1 focus:ring-primary/20 rounded-lg text-sm transition-all hover:bg-secondary/70 shadow-none">
            <div className="flex items-center gap-2 truncate">
                {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
                <SelectValue placeholder={placeholder} />
            </div>
        </SelectTrigger>
        <SelectContent>{options}</SelectContent>
    </Select>
  );

  const ManualForm = (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Name your snippet..." className="bg-secondary/50 h-10 border-transparent focus-visible:ring-1 focus-visible:ring-primary/20 rounded-lg text-sm font-medium shadow-none"/>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider">Project</Label>
                <CustomSelect value={selectedProjectId} onChange={setSelectedProjectId} placeholder="Global" icon={FileText} options={<><SelectItem value="global">Global (No Project)</SelectItem>{projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</>}/>
            </div>
            
            <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider">Language</Label>
                <CustomSelect value={language} onChange={setLanguage} placeholder="Language" icon={Code} options={<><SelectItem value="javascript">JavaScript</SelectItem><SelectItem value="typescript">TypeScript</SelectItem><SelectItem value="python">Python</SelectItem><SelectItem value="html">HTML</SelectItem><SelectItem value="css">CSS</SelectItem><SelectItem value="sql">SQL</SelectItem><SelectItem value="json">JSON</SelectItem><SelectItem value="bash">Bash</SelectItem><SelectItem value="go">Go</SelectItem><SelectItem value="java">Java</SelectItem></>}/>
            </div>
        </div>

        <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Code</Label>
            <div className="relative rounded-lg overflow-hidden border border-border/40 shadow-sm bg-[#1e1e1e] group">
                <div className="flex items-center justify-between px-2 py-1.5 bg-[#252526] border-b border-[#3e3e3e]">
                    <div className="flex gap-1.5 px-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    </div>
                    <div className="flex items-center gap-1">
                        <TooltipProvider delayDuration={0}>
                            {[
                                { id: 'fix', icon: Wand2, color: 'text-blue-400', label: 'Fix Code' },
                                { id: 'document', icon: FileJson, color: 'text-green-400', label: 'Add Docs' },
                                { id: 'security', icon: ShieldCheck, color: 'text-red-400', label: 'Scan Security' },
                                { id: 'test', icon: FlaskConical, color: 'text-orange-400', label: 'Gen Tests' },
                            ].map((tool) => (
                                <Tooltip key={tool.id}>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className={cn("h-7 w-7 hover:bg-[#3e3e3e] rounded-md transition-colors", fixing && activeAction === tool.id && `bg-${tool.color.split('-')[1]}-500/20 ${tool.color}`)} onClick={() => handleAiAction(tool.id)} disabled={fixing}>
                                            {fixing && activeAction === tool.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <tool.icon className={cn("w-3.5 h-3.5", tool.color)}/>}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-800 text-zinc-100 border-zinc-700"><p>{tool.label}</p></TooltipContent>
                                </Tooltip>
                            ))}
                        </TooltipProvider>
                    </div>
                </div>
                <Editor height={isModal ? "250px" : "350px"} theme="vs-dark" language={language} value={code} onChange={(v) => setCode(v || "")} options={{ minimap: { enabled: false }, fontSize: 13, lineHeight: 20, padding: { top: 12, bottom: 12 }, scrollBeyondLastLine: false, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", overviewRulerBorder: false, hideCursorInOverviewRuler: true, scrollbar: { vertical: 'visible', horizontal: 'visible', useShadows: false, verticalScrollbarSize: 8, horizontalScrollbarSize: 8 }, renderLineHighlight: "none", smoothScrolling: true }} />
            </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-lg shadow-sm transition-all font-medium text-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {initialData ? "Update Snippet" : "Save Snippet"}
        </Button>
    </div>
  );

  const ModalContent = (
    <div className="space-y-4">
        {mode === 'full' ? (
             <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-1 rounded-lg h-9">
                    <TabsTrigger value="manual" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">Manual Entry</TabsTrigger>
                    <TabsTrigger value="url" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">Import URL</TabsTrigger>
                </TabsList>
                <TabsContent value="manual" className="mt-4">{ManualForm}</TabsContent>
                <TabsContent value="url" className="mt-0">
                    {/* 🚀 PASS IMPORT MODE */}
                    <UrlImportForm 
                        onSuccess={handleUrlSuccess} 
                        projects={projects} 
                        defaultProjectId={selectedProjectId === "global" ? undefined : selectedProjectId} 
                        importMode={importMode} // Pass Prop
                    />
                </TabsContent>
            </Tabs>
        ) : mode === 'manual' ? ManualForm : (
            <UrlImportForm 
                onSuccess={handleUrlSuccess} 
                projects={projects} 
                defaultProjectId={selectedProjectId === "global" ? undefined : selectedProjectId} 
                importMode={importMode} // Pass Prop
            />
        )}
    </div>
  );

  // ... (Scrollbar Styles and Output Panel remain same) ...
  const CustomScrollbarStyles = () => (
    <style jsx global>{`
      .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 99px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }
    `}</style>
  );

  const OutputPanel = (
    <Card className="h-full border-border/50 shadow-none bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2 px-0"><CardTitle className="text-sm font-medium flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />{aiCode ? "AI Analysis" : "Output Preview"}</CardTitle>{aiCode && (<Button size="sm" variant="ghost" onClick={() => setAiCode(null)} className="h-7 text-xs">Clear</Button>)}</CardHeader>
        <CardContent className="px-0">
          {aiCode ? (
            <div className="space-y-4 animate-in fade-in">
                {aiExplanation && (<div className="p-3 bg-secondary/30 rounded-lg text-xs text-muted-foreground border border-border/50 leading-relaxed"><div className="flex items-center gap-2 mb-1 text-foreground font-semibold"><Info className="w-3.5 h-3.5" /> Note</div>{aiExplanation}</div>)}
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 shadow-md bg-[#1e1e1e]">
                <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800"><span className="text-[10px] text-primary font-bold uppercase tracking-wider">AI Suggestion</span><Button size="sm" onClick={handleApplyAi} className="h-6 gap-1.5 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90 px-2"><Check className="w-3 h-3" /> Apply</Button></div>
                <Editor height="300px" theme="vs-dark" language={language} value={aiCode} options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }} />
              </div>
            </div>
          ) : lastNote ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-secondary/40 rounded-xl border border-border/50 flex items-center gap-3"><div className="p-2 bg-green-500/10 rounded-full"><Check className="w-4 h-4 text-green-500" /></div><div><Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold block">Successfully Saved</Label><div className="font-semibold text-sm truncate text-foreground">{lastNote.title}</div></div></div>
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 shadow-sm opacity-90 bg-[#1e1e1e]"><Editor height="200px" theme="vs-dark" language={lastNote.language || "javascript"} value={lastNote.code_snippet} options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }} /></div>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground/40 border-2 border-dashed border-border/40 rounded-xl bg-secondary/5"><div className="text-center space-y-2"><Terminal className="w-8 h-8 mx-auto opacity-30" /><p className="text-xs font-medium">Code preview will appear here.</p></div></div>
          )}
        </CardContent>
    </Card>
  );

  if (isModal) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 gap-0 border-border/50 shadow-2xl bg-background flex flex-col sm:rounded-2xl overflow-hidden outline-none">
                <CustomScrollbarStyles />
                <div className="px-6 py-5 border-b border-border/50 bg-background sticky top-0 z-10 shrink-0">
                    <DialogHeader><DialogTitle className="flex items-center gap-3 text-lg font-bold tracking-tight"><div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">{mode === 'url' ? <Globe className="w-4 h-4"/> : <PenTool className="w-4 h-4"/>}</div>{mode === 'url' ? "Import Knowledge" : "Create New Note"}</DialogTitle></DialogHeader>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {ModalContent}
                    {aiCode && (
                        <div ref={aiOutputRef} className="mt-6 pt-6 border-t border-border">
                             {aiExplanation && (<div className="p-3 bg-secondary/30 rounded-lg text-xs text-muted-foreground border border-border/50 leading-relaxed mb-4"><div className="flex items-center gap-2 mb-1 text-foreground font-semibold"><Info className="w-3.5 h-3.5" /> Note</div>{aiExplanation}</div>)}
                            <div className="relative rounded-xl overflow-hidden border border-zinc-800 shadow-lg bg-[#1e1e1e]">
                                <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800"><span className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-2"><Sparkles className="w-3 h-3" /> AI Result</span><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => setAiCode(null)} className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full"><X className="w-3 h-3" /></Button><Button size="sm" onClick={handleApplyAi} className="h-6 gap-1.5 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90 px-2"><Check className="w-3 h-3" /> Apply Fix</Button></div></div>
                                <Editor height="200px" theme="vs-dark" language={language} value={aiCode} options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }} />
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 h-full">
        <CustomScrollbarStyles />
        <Card className="h-full border-border/50 shadow-none bg-card/50"><CardHeader><CardTitle className="flex items-center gap-2"><PenTool className="w-4 h-4 text-primary" />{initialData ? "Edit Memory" : "Studio Editor"}</CardTitle></CardHeader><CardContent>{ModalContent}</CardContent></Card>
        {OutputPanel}
    </div>
  );
}