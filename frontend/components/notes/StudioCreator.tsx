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
  Code2,
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
  AlertTriangle,
  Trash2,
  LayoutTemplate,
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
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    const marker = "`" + "`" + "`";
    const codeBlockRegex = new RegExp(
      marker + "(?:\\w+)?\\n([\\s\\S]*?)" + marker,
    );

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
    if (!code) return toast.error("Please write some code first.");
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
      toast.success("Code updated successfully.");
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
        toast.success("Saved to Knowledge Base.");
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
          "h-10 gap-2 rounded-xl border-zinc-200/80 bg-white px-3 text-sm font-semibold hover:bg-zinc-50 focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all",
          className,
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="w-4 h-4 text-zinc-400 shrink-0" />}
          <span className="truncate text-zinc-700">
            <SelectValue placeholder={placeholder} />
          </span>
        </div>
      </SelectTrigger>
      <SelectContent className="z-[9999] min-w-[140px] shadow-xl border-zinc-200 rounded-xl">
        {children}
      </SelectContent>
    </Select>
  );

  return (
    <div className="flex flex-col h-full gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-hidden bg-background">
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-2 z-30 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto px-2">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Document..."
            className="h-11 border-transparent shadow-none focus-visible:ring-0 focus-visible:border-transparent px-0 text-xl font-bold placeholder:text-zinc-300 text-zinc-900 w-full sm:w-[320px]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto px-2 sm:px-0">
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <ToolbarSelect
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              placeholder="Project"
              icon={FileText}
              className="w-full sm:w-[180px]"
            >
              <SelectItem value="global" className="cursor-pointer font-medium">
                Global Workspace
              </SelectItem>
              {projects.map((p) => (
                <SelectItem
                  key={p.id}
                  value={p.id}
                  className="cursor-pointer font-medium"
                >
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
                <SelectItem
                  key={l}
                  value={l}
                  className="cursor-pointer font-medium"
                >
                  {formatLanguage(l)}
                </SelectItem>
              ))}
            </ToolbarSelect>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="h-10 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-sm hover:shadow hover:-translate-y-[1px] transition-all shrink-0 ml-auto sm:ml-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin sm:mr-2" />
            ) : (
              <Save className="w-4 h-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Save Document</span>
          </Button>
        </div>
      </div>

      <div className="lg:hidden flex p-1 bg-zinc-100 rounded-xl mx-2 border border-zinc-200/50">
        <button
          onClick={() => setActiveView("code")}
          className={cn(
            "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
            activeView === "code"
              ? "bg-white shadow-sm text-zinc-900 border border-zinc-200/50"
              : "text-zinc-500",
          )}
        >
          <Code2 className="w-4 h-4" /> Source
        </button>
        <button
          onClick={() => setActiveView("preview")}
          className={cn(
            "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
            activeView === "preview"
              ? "bg-white shadow-sm text-primary border border-zinc-200/50"
              : "text-zinc-500",
          )}
        >
          {aiCode ? (
            <Sparkles className="w-4 h-4" />
          ) : (
            <MonitorPlay className="w-4 h-4" />
          )}{" "}
          Preview
        </button>
      </div>

      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 flex flex-col lg:flex-row gap-6">
          <div
            className={cn(
              "flex-1 flex-col h-full bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden transition-all relative",
              activeView === "code" ? "flex" : "hidden lg:flex",
            )}
          >
            <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-4 h-4 text-zinc-400" />
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                  Source Editor
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyCode}
                        className="h-8 w-8 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs font-semibold">
                      Copy Code
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setWordWrap((w) => (w === "on" ? "off" : "on"))
                        }
                        className={cn(
                          "h-8 w-8 rounded-lg transition-colors",
                          wordWrap === "on"
                            ? "text-primary bg-primary/10"
                            : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100",
                        )}
                      >
                        <WrapText className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs font-semibold">
                      Toggle Wrap
                    </TooltipContent>
                  </Tooltip>

                  <div className="w-px h-4 bg-zinc-200 mx-1"></div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowClearDialog(true)}
                        className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Eraser className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs font-semibold">
                      Clear Editor
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="flex-1 relative min-h-0 bg-white">
              <Editor
                height="100%"
                theme="light"
                language={language}
                value={code}
                onChange={(v) => setCode(v || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineHeight: 24,
                  padding: { top: 24, bottom: 90 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  wordWrap: wordWrap,
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  renderLineHighlight: "none",
                  smoothScrolling: true,
                  scrollbar: {
                    verticalScrollbarSize: 6,
                    horizontalScrollbarSize: 6,
                    verticalSliderSize: 6,
                    horizontalSliderSize: 6,
                    useShadows: false,
                    vertical: "visible",
                    horizontal: "visible",
                  },
                }}
              />
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-zinc-200 shadow-xl rounded-full px-2 py-1.5 flex items-center gap-1 z-10 transition-all hover:shadow-2xl">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mx-3 hidden sm:block">
                AI Actions
              </span>
              <div className="w-px h-5 bg-zinc-200 mr-1 hidden sm:block"></div>
              <TooltipProvider delayDuration={0}>
                {[
                  { id: "fix", icon: Wand2, label: "Auto Fix" },
                  { id: "document", icon: FileJson, label: "Write Docs" },
                  { id: "security", icon: ShieldCheck, label: "Scan Security" },
                  { id: "test", icon: FlaskConical, label: "Gen Tests" },
                ].map((tool) => (
                  <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-10 w-10 rounded-full text-zinc-500 hover:text-primary hover:bg-primary/10 transition-colors",
                          fixing &&
                            activeAction === tool.id &&
                            "bg-primary text-primary-foreground animate-pulse hover:bg-primary hover:text-primary-foreground shadow-sm",
                        )}
                        onClick={() => handleAiAction(tool.id)}
                        disabled={fixing}
                      >
                        {fixing && activeAction === tool.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <tool.icon className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="text-xs font-bold mb-2 py-1.5 px-3"
                    >
                      {tool.label}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>

          <div
            className={cn(
              "flex-1 flex-col h-full bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden transition-all",
              activeView === "preview" ? "flex" : "hidden lg:flex",
            )}
          >
            <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                {aiCode ? (
                  <Sparkles className="w-4 h-4 text-primary" />
                ) : (
                  <MonitorPlay className="w-4 h-4 text-zinc-400" />
                )}
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                  {aiCode ? "AI Insight & Output" : "Output Preview"}
                </span>
              </div>
              {aiCode && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAiCode(null)}
                  className="h-8 text-xs font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50 px-3 rounded-lg transition-colors"
                >
                  Discard Changes
                </Button>
              )}
            </div>

            <div className="flex-1 relative bg-[#fafafa] min-h-0">
              {aiCode ? (
                <div className="absolute inset-0 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                  {aiExplanation && (
                    <div className="m-5 p-5 bg-white border border-zinc-200/80 rounded-xl shadow-sm shrink-0 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                      <div className="flex items-center gap-2 mb-3 text-primary font-bold uppercase tracking-widest text-[11px]">
                        <Info className="w-4 h-4" /> Developer Note
                      </div>
                      <div className="text-sm text-zinc-600 leading-relaxed max-h-[140px] overflow-y-auto main-scrollbar pr-2 font-medium">
                        {aiExplanation}
                      </div>
                    </div>
                  )}
                  <div className="flex-1 flex flex-col min-h-0 relative mx-5 mb-5 bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-hidden">
                    <div className="absolute bottom-5 right-5 z-10">
                      <Button
                        size="sm"
                        onClick={handleApplyAi}
                        className="h-11 px-6 gap-2 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg border-0 rounded-xl transition-all hover:-translate-y-1 hover:shadow-xl"
                      >
                        <Check className="w-4 h-4" /> Apply AI Changes
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
                        padding: { top: 24, bottom: 90 },
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        scrollbar: {
                          verticalScrollbarSize: 6,
                          horizontalScrollbarSize: 6,
                          verticalSliderSize: 6,
                          horizontalSliderSize: 6,
                          useShadows: false,
                          vertical: "visible",
                          horizontal: "visible",
                        },
                      }}
                    />
                  </div>
                </div>
              ) : lastNote ? (
                <div className="absolute inset-0 flex flex-col animate-in fade-in zoom-in-95 duration-200 p-5">
                  <div className="flex-1 bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-hidden opacity-90">
                    <Editor
                      height="100%"
                      theme="light"
                      language={lastNote.language || "javascript"}
                      value={lastNote.code_snippet}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 13,
                        padding: { top: 24 },
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        scrollbar: {
                          verticalScrollbarSize: 6,
                          horizontalScrollbarSize: 6,
                          verticalSliderSize: 6,
                          horizontalSliderSize: 6,
                          useShadows: false,
                          vertical: "visible",
                          horizontal: "visible",
                        },
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 space-y-6">
                  <div className="w-24 h-24 rounded-3xl bg-white border border-zinc-200/80 flex items-center justify-center shadow-sm rotate-3">
                    <MonitorPlay
                      className="w-10 h-10 text-zinc-300"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-zinc-600 tracking-tight">
                      Workspace Ready
                    </p>
                    <p className="text-sm font-medium text-zinc-400 mt-2 max-w-[240px] leading-relaxed mx-auto">
                      Write code on the left and utilize AI tools to generate
                      insights here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden border-zinc-200 shadow-2xl rounded-2xl">
          <div className="bg-red-50/80 p-8 flex flex-col items-center justify-center border-b border-red-100">
            <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-5 border border-red-100">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <DialogTitle className="text-zinc-900 text-2xl font-bold tracking-tight">
              Clear Editor?
            </DialogTitle>
            <DialogDescription className="text-center text-zinc-600 mt-2 max-w-[280px] font-medium leading-relaxed">
              This will instantly remove all code and text from the active
              workspace.
            </DialogDescription>
          </div>

          <div className="p-7 bg-white">
            <div className="text-sm text-zinc-500 text-center mb-8 leading-relaxed font-medium">
              If you have not saved your changes, they will be{" "}
              <span className="font-bold text-zinc-900">permanently lost</span>.
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowClearDialog(false)}
                className="flex-1 h-12 rounded-xl border-zinc-200 font-bold hover:bg-zinc-50 text-zinc-700 transition-colors"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmClear}
                className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 font-bold shadow-sm transition-all"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Yes, Clear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}