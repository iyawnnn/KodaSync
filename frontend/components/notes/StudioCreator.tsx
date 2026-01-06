"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Editor from "@monaco-editor/react";
import {
  Wand2,
  Save,
  Loader2,
  FileText,
  Code,
  Check,
  Sparkles,
  ShieldCheck,
  FlaskConical,
  FileJson,
  Info,
  Copy,
  WrapText,
  Eraser,
  MonitorPlay,
  Settings2,
  AlertTriangle, // 🚀 Icon for Modal
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"; // 🚀 Imports for Modal
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NoteData {
  id?: string;
  title: string;
  code_snippet: string;
  language: string;
  tags?: string;
  project_id?: string;
}

const formatLanguage = (lang: string) => {
  const acronyms = ["html", "css", "sql", "json", "xml", "php"];
  if (acronyms.includes(lang.toLowerCase())) {
    return lang.toUpperCase();
  }
  return lang.charAt(0).toUpperCase() + lang.slice(1);
};

export default function StudioCreator({
  initialData,
  onSuccess,
  currentProjectId,
}: {
  initialData?: NoteData | null;
  onSuccess?: (data?: any) => void;
  currentProjectId?: string | null;
}) {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("global");
  const [wordWrap, setWordWrap] = useState<"on" | "off">("on");

  const [activeView, setActiveView] = useState<"code" | "preview">("code");

  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const [lastNote, setLastNote] = useState<any>(null);
  const [aiCode, setAiCode] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // 🚀 STATE FOR CLEAR MODAL
  const [showClearDialog, setShowClearDialog] = useState(false);

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
      setAiCode(null);
    } else {
      setTitle("");
      setCode("");
      setLastNote(null);
      setAiCode(null);
      setAiExplanation(null);
    }
  }, [initialData]);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects/");
      setProjects(res.data);
    } catch (e) {}
  };

  const cleanAiResponse = (response: string) => {
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/;
    const match = response.match(codeBlockRegex);
    if (match) {
      return {
        code: match[1].trim(),
        explanation: response.replace(codeBlockRegex, "").trim(),
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

    if (window.innerWidth < 1024) setActiveView("preview");

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
      setActiveView("code");
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

      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success("Code copied");
  };

  // 🚀 CONFIRM CLEAR FUNCTION
  const confirmClear = () => {
    setCode("");
    setTitle("");
    setLastNote(null);
    setAiCode(null);
    setShowClearDialog(false);
    toast.success("Editor cleared");
  };

  const ToolbarSelect = ({
    value,
    onChange,
    children,
    icon: Icon,
    placeholder,
    className,
  }: any) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "h-9 w-full gap-2 rounded-lg border-zinc-200 bg-white px-3 text-xs font-medium hover:bg-zinc-50 focus:ring-2 focus:ring-primary/10 shadow-sm transition-all",
          className
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
          <span className="truncate text-zinc-700">
            <SelectValue placeholder={placeholder} />
          </span>
        </div>
      </SelectTrigger>
      <SelectContent className="z-[9999] min-w-[140px] shadow-lg border-zinc-200">
        {children}
      </SelectContent>
    </Select>
  );

  const ActionButton = ({
    icon: Icon,
    onClick,
    label,
    active,
    loading,
  }: any) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={loading}
          className={cn(
            "h-8 w-8 rounded-lg transition-all shrink-0",
            active
              ? "bg-primary/10 text-primary"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
          )}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Icon className="w-4 h-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="text-xs font-medium">{label}</TooltipContent>
    </Tooltip>
  );

  const CustomScrollbarStyles = () => (
    <style jsx global>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e4e4e7;
        border-radius: 99px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #d4d4d8;
      }
    `}</style>
  );

  return (
    <div className="flex flex-col h-full gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-hidden">
      <CustomScrollbarStyles />

      {/* HEADER */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-3 z-30 shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto min-w-0">
            <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
              <Code className="w-5 h-5" />
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Document..."
              className="h-9 border-none shadow-none focus-visible:ring-0 px-2 text-lg font-bold placeholder:text-zinc-300 text-zinc-900 min-w-[100px] flex-1"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 flex-1 sm:flex-none w-full sm:w-auto">
              <ToolbarSelect
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                placeholder="Project"
                icon={FileText}
                className="w-full sm:w-[160px]"
              >
                <SelectItem value="global">Global</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </ToolbarSelect>

              <ToolbarSelect
                value={language}
                onChange={setLanguage}
                icon={Settings2}
                className="w-full sm:w-[140px]"
              >
                {[
                  "javascript",
                  "typescript",
                  "python",
                  "html",
                  "css",
                  "sql",
                  "json",
                  "bash",
                  "go",
                  "java",
                ].map((l) => (
                  <SelectItem key={l} value={l}>
                    {formatLanguage(l)}
                  </SelectItem>
                ))}
              </ToolbarSelect>
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:shadow-md transition-all shrink-0"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin sm:mr-2" />
              ) : (
                <Save className="w-3.5 h-3.5 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Save</span>
            </Button>
          </div>
        </div>

        <div className="lg:hidden mt-3 pt-3 border-t border-zinc-100 flex p-1 bg-zinc-100/50 rounded-lg">
          <button
            onClick={() => setActiveView("code")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5",
              activeView === "code"
                ? "bg-white shadow-sm text-zinc-900"
                : "text-zinc-500"
            )}
          >
            <Code className="w-3.5 h-3.5" /> Editor
          </button>
          <button
            onClick={() => setActiveView("preview")}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5",
              activeView === "preview"
                ? "bg-white shadow-sm text-primary"
                : "text-zinc-500"
            )}
          >
            {aiCode ? (
              <Sparkles className="w-3.5 h-3.5" />
            ) : (
              <MonitorPlay className="w-3.5 h-3.5" />
            )}{" "}
            Preview
          </button>
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 flex flex-col lg:flex-row gap-4">
          {/* EDITOR PANEL */}
          <div
            className={cn(
              "flex-1 flex-col h-full bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden transition-all",
              activeView === "code" ? "flex" : "hidden lg:flex"
            )}
          >
            <div className="h-12 px-4 flex items-center justify-between border-b border-zinc-100 bg-white shrink-0">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider truncate">
                Source Code
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <TooltipProvider delayDuration={0}>
                  <ActionButton
                    icon={Copy}
                    onClick={handleCopyCode}
                    label="Copy Code"
                  />
                  <ActionButton
                    icon={WrapText}
                    onClick={() =>
                      setWordWrap((w) => (w === "on" ? "off" : "on"))
                    }
                    label="Toggle Wrap"
                    active={wordWrap === "on"}
                  />
                  {/* 🚀 OPEN MODAL ON CLICK */}
                  <ActionButton
                    icon={Eraser}
                    onClick={() => setShowClearDialog(true)}
                    label="Clear"
                  />
                </TooltipProvider>
              </div>
            </div>

            <div className="flex-1 relative min-h-0">
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
                  padding: { top: 16, bottom: 16 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  wordWrap: wordWrap,
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  renderLineHighlight: "none",
                  smoothScrolling: true,
                }}
              />
            </div>

            {/* Footer Tools */}
            <div className="h-10 px-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
              <Badge
                variant="outline"
                className="bg-white text-[10px] text-zinc-500 font-mono border-zinc-200 shrink-0"
              >
                Ready
              </Badge>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mr-2 hidden sm:block">
                  AI Assistants
                </span>
                <TooltipProvider delayDuration={0}>
                  {[
                    {
                      id: "fix",
                      icon: Wand2,
                      color: "text-blue-600",
                      label: "Auto Fix",
                    },
                    {
                      id: "document",
                      icon: FileJson,
                      color: "text-green-600",
                      label: "Write Docs",
                    },
                    {
                      id: "security",
                      icon: ShieldCheck,
                      color: "text-red-600",
                      label: "Scan Security",
                    },
                    {
                      id: "test",
                      icon: FlaskConical,
                      color: "text-orange-600",
                      label: "Gen Tests",
                    },
                  ].map((tool) => (
                    <Tooltip key={tool.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            "h-7 w-7 bg-white border-zinc-200 shadow-sm hover:bg-zinc-50 transition-all",
                            fixing &&
                              activeAction === tool.id &&
                              "bg-primary/5 border-primary/20 animate-pulse"
                          )}
                          onClick={() => handleAiAction(tool.id)}
                          disabled={fixing}
                        >
                          {fixing && activeAction === tool.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <tool.icon
                              className={cn("w-3.5 h-3.5", tool.color)}
                            />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {tool.label}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* OUTPUT PANEL */}
          <div
            className={cn(
              "flex-1 flex-col h-full bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden transition-all",
              activeView === "preview" ? "flex" : "hidden lg:flex"
            )}
          >
            <div className="h-12 px-4 flex items-center justify-between border-b border-zinc-100 bg-white shrink-0">
              <div className="flex items-center gap-2">
                {aiCode ? (
                  <Sparkles className="w-4 h-4 text-primary" />
                ) : (
                  <MonitorPlay className="w-4 h-4 text-zinc-400" />
                )}
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {aiCode ? "AI Analysis" : "Preview"}
                </span>
              </div>
              {aiCode && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAiCode(null)}
                  className="h-6 text-[10px] text-zinc-400 hover:text-red-500 px-2 rounded-md"
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="flex-1 relative bg-zinc-50/30 min-h-0">
              {aiCode ? (
                <div className="absolute inset-0 flex flex-col animate-in fade-in">
                  {aiExplanation && (
                    <div className="p-4 bg-blue-50/50 border-b border-blue-100 text-xs text-zinc-700 leading-relaxed max-h-[150px] overflow-y-auto shrink-0">
                      <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold uppercase tracking-wider text-[10px]">
                        <Info className="w-3 h-3" /> Insight
                      </div>
                      {aiExplanation}
                    </div>
                  )}
                  <div className="flex-1 flex flex-col min-h-0 relative">
                    <div className="absolute top-4 right-6 z-10">
                      <Button
                        size="sm"
                        onClick={handleApplyAi}
                        className="h-8 gap-1.5 text-[10px] bg-green-600 hover:bg-green-500 text-white shadow-md border-0 px-3 rounded-full transition-all hover:scale-105"
                      >
                        <Check className="w-3 h-3" /> Apply Fix
                      </Button>
                    </div>
                    <Editor
                      height="100%"
                      theme="light"
                      language={language}
                      value={aiCode}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 13,
                        padding: { top: 16 },
                      }}
                    />
                  </div>
                </div>
              ) : lastNote ? (
                <div className="absolute inset-0 flex flex-col animate-in fade-in">
                  <div className="p-3 bg-green-50/50 border-b border-green-100 flex items-center justify-center gap-2 text-green-700 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">
                      Saved Successfully
                    </span>
                  </div>
                  <div className="flex-1 opacity-75">
                    <Editor
                      height="100%"
                      theme="light"
                      language={lastNote.language || "javascript"}
                      value={lastNote.code_snippet}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                    <MonitorPlay
                      className="w-8 h-8 opacity-50"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-xs font-medium opacity-70">
                    No output generated yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 BEAUTIFUL CLEAR MODAL */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden border-destructive/20 shadow-2xl">
          <div className="bg-destructive/10 p-6 flex flex-col items-center justify-center border-b border-destructive/10">
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-destructive text-lg font-bold">
              Clear Editor?
            </DialogTitle>
            <DialogDescription className="text-center text-destructive/80 mt-1 max-w-[280px]">
              This will remove all code and text from the editor.
            </DialogDescription>
          </div>

          <div className="p-6 bg-background">
            <div className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
              If you haven't saved your changes, they will be{" "}
              <span className="font-bold text-foreground">lost forever</span>.
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowClearDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmClear}
                className="flex-1 bg-destructive hover:bg-destructive/90"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Yes, Clear it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
