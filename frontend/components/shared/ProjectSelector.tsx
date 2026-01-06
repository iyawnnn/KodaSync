"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Folder } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function ProjectSelector({
  currentProjectId,
  onProjectSelect,
  className,
}: {
  currentProjectId: string | null;
  onProjectSelect: (id: string | null) => void;
  className?: string;
}) {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects/");
      setProjects(res.data);
    } catch (e) {
      // Silent fail
    }
  };

  return (
    <Select
      value={currentProjectId || "global"}
      onValueChange={(val) => onProjectSelect(val === "global" ? null : val)}
    >
      <SelectTrigger 
        className={cn(
            // 🎨 UNIFORM STYLE: Flat, clean, no shadows, standard border
            "w-full h-9 text-xs focus:ring-1 focus:ring-primary/20",
            "bg-background border border-border text-foreground",
            "hover:bg-accent/50 hover:text-accent-foreground",
            "transition-colors",
            className
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <Folder className="w-3.5 h-3.5 text-primary" />
          <SelectValue placeholder="Select Context" />
        </div>
      </SelectTrigger>
      
      <SelectContent className="max-h-[200px] border-border bg-popover text-popover-foreground shadow-md">
        <SelectItem value="global" className="text-xs cursor-pointer focus:bg-accent focus:text-accent-foreground">
          <span className="font-medium text-primary">Global (All Notes)</span>
        </SelectItem>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id} className="text-xs cursor-pointer focus:bg-accent focus:text-accent-foreground">
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}