"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Editor from "@monaco-editor/react";
import { Sparkles, Check, Terminal, Info, X, Zap } from "lucide-react";

interface NoteOutputProps {
  aiCode: string | null;
  aiExplanation: string | null;
  lastNote: any;
  onApplyFix: () => void;
  onClearAi: () => void;
  language: string;
}

export default function NoteOutput({
  aiCode,
  aiExplanation,
  lastNote,
  onApplyFix,
  onClearAi,
  language,
}: NoteOutputProps) {
  return (
    <Card className="h-full border-border/50 shadow-sm bg-card/50 flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border/40 bg-muted/30 shrink-0">
        <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
          {aiCode ? <Sparkles className="w-3.5 h-3.5 text-blue-500" /> : <Terminal className="w-3.5 h-3.5" />}
          {aiCode ? "AI Analysis" : "Output Console"}
        </CardTitle>
        {aiCode && (
          <Button size="sm" variant="ghost" onClick={onClearAi} className="h-6 w-6 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive">
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="p-0 flex-1 relative bg-[#1e1e1e]">
        {aiCode ? (
          <div className="absolute inset-0 flex flex-col animate-in fade-in">
            {aiExplanation && (
              <div className="p-3 bg-[#252526] border-b border-[#3e3e3e] text-xs text-zinc-300 leading-relaxed max-h-[120px] overflow-y-auto">
                <div className="flex items-center gap-2 mb-1.5 text-blue-400 font-bold text-[10px] uppercase">
                  <Info className="w-3 h-3" /> Insight
                </div>
                {aiExplanation}
              </div>
            )}
            
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] border-b border-[#3e3e3e] shrink-0">
                    <span className="text-[10px] text-zinc-400 font-mono">Proposed Changes</span>
                    <Button size="sm" onClick={onApplyFix} className="h-6 gap-1.5 text-[10px] bg-blue-600 hover:bg-blue-500 text-white border-0 px-2.5 rounded-md">
                        <Check className="w-3 h-3" /> Apply
                    </Button>
                </div>
                <div className="flex-1 relative">
                    <Editor 
                        height="100%" 
                        theme="vs-dark" 
                        language={language} 
                        value={aiCode} 
                        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, padding: {top: 12} }} 
                    />
                </div>
            </div>
          </div>
        ) : lastNote ? (
          <div className="absolute inset-0 flex flex-col animate-in fade-in">
            <div className="p-3 bg-[#252526] border-b border-[#3e3e3e] flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold">Saved Successfully</span>
                </div>
            </div>
            <div className="flex-1 opacity-80">
                <Editor 
                    height="100%" 
                    theme="vs-dark" 
                    language={lastNote.language || "javascript"} 
                    value={lastNote.code_snippet} 
                    options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }} 
                />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 space-y-3">
            <Zap className="w-10 h-10 opacity-20" />
            <p className="text-xs font-medium opacity-50">Run an AI tool to see results</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}