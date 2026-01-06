"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Editor from "@monaco-editor/react";
import {
  Wand2,
  Save,
  Loader2,
  FileText,
  Code,
  ShieldCheck,
  FlaskConical,
  FileJson,
  Sparkles,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface NoteFormProps {
  title: string;
  setTitle: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  selectedProjectId: string;
  setSelectedProjectId: (v: string) => void;
  projects: any[];
  onSave: () => void;
  loading: boolean;
  isModal?: boolean;
  fixing: boolean;
  activeAction: string | null;
  onAiAction: (action: string) => void;
}

export default function NoteForm({
  title,
  setTitle,
  code,
  setCode,
  language,
  setLanguage,
  selectedProjectId,
  setSelectedProjectId,
  projects,
  onSave,
  loading,
  isModal,
  fixing,
  activeAction,
  onAiAction,
}: NoteFormProps) {
  
  return (
    <div className="flex flex-col h-full gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* 1. Header Section */}
      <div className="flex flex-col gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Note..."
          className="text-lg md:text-xl font-bold border-transparent px-0 h-auto focus-visible:ring-0 rounded-none border-b border-border/40 hover:border-border placeholder:text-muted-foreground/40 transition-colors"
        />
        
        <div className="flex items-center gap-3">
           {/* Project Selector */}
           <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[180px] h-8 text-xs bg-secondary/30 border-transparent hover:bg-secondary/50 rounded-full">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-3.5 h-3.5 opacity-50" />
                <SelectValue placeholder="Select Project" />
              </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="global">Global (No Project)</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2. Editor Section */}
      <div className="flex-1 flex flex-col min-h-[300px] rounded-xl border border-border/60 shadow-sm bg-card overflow-hidden">
          
          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20">
             
             {/* Left: Language */}
             <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-7 w-[130px] text-xs bg-background border-border/50 focus:ring-0">
                    <div className="flex items-center gap-2">
                        <Code className="w-3.5 h-3.5 text-primary" />
                        <SelectValue />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {["javascript", "typescript", "python", "html", "css", "sql", "json", "bash", "go", "java"].map((l) => (
                        <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>
                    ))}
                </SelectContent>
             </Select>

             {/* Right: AI Actions */}
             <div className="flex items-center gap-1">
                <TooltipProvider delayDuration={0}>
                    {[
                        { id: 'fix', icon: Wand2, color: 'text-blue-500', label: 'Fix Code', bg: 'hover:bg-blue-500/10' },
                        { id: 'document', icon: FileJson, color: 'text-green-500', label: 'Generate Docs', bg: 'hover:bg-green-500/10' },
                        { id: 'security', icon: ShieldCheck, color: 'text-red-500', label: 'Security Scan', bg: 'hover:bg-red-500/10' },
                        { id: 'test', icon: FlaskConical, color: 'text-orange-500', label: 'Generate Tests', bg: 'hover:bg-orange-500/10' },
                    ].map((tool) => (
                        <Tooltip key={tool.id}>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={cn("h-7 w-7 rounded-md transition-all", tool.bg, fixing && activeAction === tool.id && "bg-secondary")}
                                    onClick={() => onAiAction(tool.id)}
                                    disabled={fixing}
                                >
                                    {fixing && activeAction === tool.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground"/>
                                    ) : (
                                        <tool.icon className={cn("w-3.5 h-3.5", tool.color)}/>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs font-medium bg-popover text-popover-foreground border-border">{tool.label}</TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
             </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative bg-[#1e1e1e]">
             <Editor
                height="100%"
                theme="vs-dark"
                language={language}
                value={code}
                onChange={(v) => setCode(v || "")}
                options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineHeight: 22,
                    padding: { top: 16, bottom: 16 },
                    scrollBeyondLastLine: false,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    overviewRulerBorder: false,
                    hideCursorInOverviewRuler: true,
                    renderLineHighlight: "none",
                    smoothScrolling: true,
                    scrollbar: {
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                    }
                }}
             />
          </div>
      </div>

      {/* 3. Footer Action */}
      <Button 
        onClick={onSave} 
        disabled={loading} 
        className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-md hover:shadow-lg transition-all"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        {title ? "Save Snippet" : "Save as Draft"}
      </Button>
    </div>
  );
}