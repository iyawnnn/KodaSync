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
  importMode = "save" 
}: {
  initialData?: NoteData | null;
  onSuccess?: (data?: any) => void;
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
  const [wordWrap, setWordWrap] = useState<"on" | "off">("on");

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
      if (onSuccess) onSuccess(data); 
      if (isModal) setOpen(false);
  }

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const FormSelect = ({ value, onChange, placeholder, options, icon: Icon }: any) => (
    <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full h-9 bg-white border-zinc-200 focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-medium hover:bg-zinc-50 shadow-sm text-zinc-700">
            <div className="flex items-center gap-2 truncate">
                {Icon && <Icon className="w-3.5 h-3.5 text-zinc-400" />}
                <SelectValue placeholder={placeholder} />
            </div>
        </SelectTrigger>
        <SelectContent className="z-[9999] border-zinc-200 shadow-lg">{options}</SelectContent>
    </Select>
  );

  const ManualForm = (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="space-y-3">
            <div className="space-y-1">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Title</Label>
                <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Note Title..." 
                    className="h-9 bg-white border-zinc-200 text-sm font-semibold placeholder:text-zinc-300 focus-visible:ring-primary/20"
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Project</Label>
                    <FormSelect 
                        value={selectedProjectId} 
                        onChange={setSelectedProjectId} 
                        placeholder="Global" 
                        icon={FileText} 
                        options={
                            <>
                                <SelectItem value="global">Global</SelectItem>
                                {projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                            </>
                        }
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Language</Label>
                    <FormSelect 
                        value={language} 
                        onChange={setLanguage} 
                        placeholder="Language" 
                        icon={Code} 
                        options={
                            ["javascript","typescript","python","html","css","sql","json","bash","go","java"].map(l => (
                                <SelectItem key={l} value={l} className="capitalize">{capitalize(l)}</SelectItem>
                            ))
                        }
                    />
                </div>
            </div>
        </div>

        <div className="flex flex-col rounded-xl border border-zinc-200 shadow-sm bg-white overflow-hidden h-[320px]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 bg-white">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Source</span>
                </div>
                <div className="flex items-center gap-1">
                    <TooltipProvider delayDuration={0}>
                        {[
                            { id: 'fix', icon: Wand2, color: 'text-blue-600', label: 'Fix Code' },
                            { id: 'document', icon: FileJson, color: 'text-green-600', label: 'Add Docs' },
                            { id: 'security', icon: ShieldCheck, color: 'text-red-600', label: 'Scan Security' },
                            { id: 'test', icon: FlaskConical, color: 'text-orange-600', label: 'Gen Tests' },
                        ].map((tool) => (
                            <Tooltip key={tool.id}>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className={cn("h-7 w-7 rounded-md transition-all hover:bg-zinc-50", fixing && activeAction === tool.id && "bg-primary/5 animate-pulse")} 
                                        onClick={() => handleAiAction(tool.id)} 
                                        disabled={fixing}
                                    >
                                        {fixing && activeAction === tool.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground"/> : <tool.icon className={cn("w-3.5 h-3.5", tool.color)}/>}
                                    </Button>
                                </TooltipTrigger>
                                {/* 🚀 FIXED: Tooltip style (White bg, Dark text) */}
                                <TooltipContent className="text-xs bg-white text-zinc-700 border-zinc-200 shadow-md font-medium"><p>{tool.label}</p></TooltipContent>
                            </Tooltip>
                        ))}
                    </TooltipProvider>
                </div>
            </div>
            
            <div className="flex-1 relative">
                <Editor 
                    height="100%" 
                    theme="light" 
                    language={language} 
                    value={code} 
                    onChange={(v) => setCode(v || "")} 
                    options={{ 
                        minimap: { enabled: false }, 
                        fontSize: 13, 
                        lineHeight: 22, 
                        padding: { top: 12, bottom: 12 }, 
                        scrollBeyondLastLine: false, 
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace", 
                        overviewRulerBorder: false, 
                        hideCursorInOverviewRuler: true, 
                        renderLineHighlight: "none", 
                        smoothScrolling: true,
                        wordWrap: wordWrap 
                    }} 
                />
            </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-lg shadow-sm transition-all font-semibold text-xs">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
            {initialData ? "Update Note" : "Save Note"}
        </Button>
    </div>
  );

  const ModalContent = (
    <div className="space-y-4 h-full">
        {mode === 'full' ? (
             <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-zinc-100 p-1 rounded-lg h-9">
                    <TabsTrigger value="manual" className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all text-zinc-500 data-[state=active]:text-zinc-900">Manual</TabsTrigger>
                    <TabsTrigger value="url" className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all text-zinc-500 data-[state=active]:text-zinc-900">Import URL</TabsTrigger>
                </TabsList>
                <TabsContent value="manual" className="mt-4">{ManualForm}</TabsContent>
                <TabsContent value="url" className="mt-4">
                    <UrlImportForm 
                        onSuccess={handleUrlSuccess} 
                        projects={projects} 
                        defaultProjectId={selectedProjectId === "global" ? undefined : selectedProjectId} 
                        importMode={importMode} 
                    />
                </TabsContent>
            </Tabs>
        ) : mode === 'manual' ? ManualForm : (
            <UrlImportForm 
                onSuccess={handleUrlSuccess} 
                projects={projects} 
                defaultProjectId={selectedProjectId === "global" ? undefined : selectedProjectId} 
                importMode={importMode} 
            />
        )}
    </div>
  );

  const CustomScrollbarStyles = () => (
    <style jsx global>{`
      .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 99px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4d4d8; }
    `}</style>
  );

  if (isModal) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] p-0 gap-0 border-zinc-200 shadow-2xl bg-white flex flex-col sm:rounded-xl overflow-hidden outline-none">
                <CustomScrollbarStyles />
                {/* 🚀 FIXED HEADER: Flex between + Close Button */}
                <div className="px-5 py-4 border-b border-zinc-100 bg-white sticky top-0 z-10 shrink-0 flex items-center justify-between">
                    <DialogHeader className="p-0">
                        <DialogTitle className="flex items-center gap-3 text-base font-bold tracking-tight text-zinc-900">
                            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary">
                                {mode === 'url' ? <Globe className="w-4 h-4"/> : <PenTool className="w-4 h-4"/>}
                            </div>
                            {mode === 'url' ? "Import Knowledge" : "Create Note"}
                        </DialogTitle>
                    </DialogHeader>
                    {/* 🚀 CLOSE BUTTON */}
                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                    {ModalContent}
                    
                    {/* AI Result Area (Styled Light) */}
                    {aiCode && (
                        <div ref={aiOutputRef} className="mt-6 pt-6 border-t border-zinc-100">
                             {aiExplanation && (
                                <div className="p-3 bg-blue-50/50 rounded-lg text-xs text-zinc-600 border border-blue-100 leading-relaxed mb-4">
                                    <div className="flex items-center gap-2 mb-1 text-blue-600 font-bold uppercase text-[10px]">
                                        <Info className="w-3.5 h-3.5" /> Insight
                                    </div>
                                    {aiExplanation}
                                </div>
                            )}
                            <div className="flex flex-col rounded-xl border border-zinc-200 shadow-md bg-white overflow-hidden">
                                <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 border-b border-zinc-200">
                                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" /> AI Result
                                    </span>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setAiCode(null)} className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-900 rounded-full">
                                            <X className="w-3 h-3" />
                                        </Button>
                                        <Button size="sm" onClick={handleApplyAi} className="h-6 gap-1.5 text-[10px] bg-green-600 hover:bg-green-500 text-white px-2 rounded-md shadow-sm">
                                            <Check className="w-3 h-3" /> Apply
                                        </Button>
                                    </div>
                                </div>
                                <Editor height="200px" theme="light" language={language} value={aiCode} options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }} />
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
  }

  // Fallback for non-modal usage
  return (
    <div className="h-full">
        <CustomScrollbarStyles />
        <Card className="h-full border-zinc-200 shadow-none bg-white">
            <CardHeader className="py-4 px-5 border-b border-zinc-100">
                <CardTitle className="flex items-center gap-2 text-base">
                    <PenTool className="w-4 h-4 text-primary" />
                    {initialData ? "Edit Note" : "New Note"}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-5 overflow-y-auto custom-scrollbar h-[calc(100%-60px)]">
                {ModalContent}
            </CardContent>
        </Card>
    </div>
  );
}