"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Link as LinkIcon, 
  Download, 
  Loader2, 
  FileText, 
  MessageSquarePlus, 
  AlertCircle,
  Github,
  AlignLeft,
  CheckCircle2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UrlImportFormProps {
  onSuccess: (data: any) => void;
  projects: any[];
  defaultProjectId?: string;
  importMode?: "save" | "chat"; 
}

export default function UrlImportForm({ 
  onSuccess, 
  projects, 
  defaultProjectId,
  importMode = "save"
}: UrlImportFormProps) {
  const [url, setUrl] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId || "global");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!url.trim()) return toast.error("URL is required");
    
    const isRaw = url.includes("raw");
    if (!isRaw) {
        toast.warning("Tip: Use a 'Raw' link for best results!", {
            duration: 4000,
        });
    }

    setLoading(true);
    try {
      const res = await api.post("/notes/import-url", {
        url,
        project_id: selectedProjectId === "global" ? null : selectedProjectId,
        save: importMode === "save" 
      });

      if (importMode === "chat") {
          toast.success("Code fetched successfully");
      } else {
          toast.success("Scraped & Memorized!");
      }
      
      setUrl("");
      onSuccess(res.data); 
    } catch (e: any) {
      // 🚀 ERROR HANDLING: Extract specific message from Backend
      const errorMessage = e.response?.data?.detail || "Failed to import URL";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="py-2 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
         
         {importMode === "save" && (
             <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider">Project Context</Label>
                    <CustomSelect
                        value={selectedProjectId}
                        onChange={setSelectedProjectId}
                        placeholder="Global"
                        icon={FileText}
                        options={
                            <>
                                <SelectItem value="global">Global (No Project)</SelectItem>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </>
                        }
                    />
                </div>
             </div>
         )}

         <div className="flex flex-col gap-3 p-5 border border-dashed border-border rounded-xl bg-secondary/10">
            <div className="flex items-center gap-2 mb-1">
                <div className="bg-primary/10 p-1.5 rounded-md">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Trusted Sources</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80 bg-background/50 p-3 rounded border border-border/50">
                    <Github className="w-3.5 h-3.5 text-foreground" /> GitHub Raw
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80 bg-background/50 p-3 rounded border border-border/50">
                    <AlignLeft className="w-3.5 h-3.5 text-orange-500" /> Plain Text
                </div>
            </div>
        </div>
        
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider">Source URL</Label>
                <div className="relative w-full">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                        value={url} 
                        onChange={(e) => setUrl(e.target.value)} 
                        className="pl-9 h-10 bg-secondary/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary/20 rounded-lg text-sm font-medium shadow-none" 
                        placeholder="https://raw.githubusercontent.com/user/repo/..." 
                    />
                </div>
            </div>

            <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 py-2 px-3 flex items-center">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <AlertDescription className="text-xs ml-2 leading-tight">
                    For best results, use 'Raw' links to avoid HTML clutter.
                </AlertDescription>
            </Alert>
            
            <Button onClick={handleImport} disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-lg shadow-sm transition-all font-medium text-sm mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (
                    importMode === "chat" 
                        ? <MessageSquarePlus className="w-4 h-4 mr-2" /> 
                        : <Download className="w-4 h-4 mr-2" />
                )}
                {importMode === "chat" ? "Fetch to Chat" : "Analyze & Save"}
            </Button>
        </div>
    </div>
  );
}