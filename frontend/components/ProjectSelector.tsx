"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Folder, Plus, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
}

interface ProjectSelectorProps {
  currentProjectId: string | null;
  onProjectSelect: (projectId: string | null) => void;
}

export default function ProjectSelector({ currentProjectId, onProjectSelect }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  // Load Projects on Mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects/");
      setProjects(res.data);
    } catch (e) {
      console.error("Failed to load projects");
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const res = await api.post("/projects/", { name: newProjectName });
      setProjects([res.data, ...projects]);
      onProjectSelect(res.data.id); // Auto-select new project
      setNewProjectName("");
      setIsCreating(false);
      toast.success("Project created!");
    } catch (e) {
      toast.error("Failed to create project");
    }
  };

  // Find active project name for display
  const activeProject = projects.find((p) => p.id === currentProjectId);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white h-9 px-3 gap-2 min-w-[140px] justify-between">
            <div className="flex items-center gap-2 truncate">
              <Folder className="w-4 h-4 text-blue-500" />
              <span className="truncate max-w-[100px]">
                {activeProject ? activeProject.name : "Global Context"}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[220px] bg-zinc-950 border-zinc-800 text-zinc-300">
          <DropdownMenuLabel className="text-xs text-zinc-500 uppercase tracking-wider">
            Select Context
          </DropdownMenuLabel>
          
          <DropdownMenuItem 
            onClick={() => onProjectSelect(null)}
            className="focus:bg-zinc-900 focus:text-white cursor-pointer gap-2"
          >
            <div className={`w-2 h-2 rounded-full ${!currentProjectId ? "bg-green-500" : "bg-zinc-700"}`} />
            Global (All Notes)
            {!currentProjectId && <Check className="w-3 h-3 ml-auto text-green-500" />}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-zinc-800" />
          
          <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
            {projects.map((p) => (
              <DropdownMenuItem 
                key={p.id} 
                onClick={() => onProjectSelect(p.id)}
                className="focus:bg-zinc-900 focus:text-white cursor-pointer gap-2"
              >
                <Folder className={`w-3 h-3 ${currentProjectId === p.id ? "text-blue-500" : "text-zinc-600"}`} />
                <span className="truncate">{p.name}</span>
                {currentProjectId === p.id && <Check className="w-3 h-3 ml-auto text-blue-500" />}
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator className="bg-zinc-800" />

          {/* Create New Project Inline Form */}
          <div className="p-2">
            {isCreating ? (
              <form onSubmit={handleCreateProject} className="flex flex-col gap-2">
                <Input 
                  autoFocus
                  placeholder="Project Name..." 
                  className="h-8 text-xs bg-zinc-900 border-zinc-700"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
                <div className="flex gap-1">
                  <Button type="submit" size="sm" className="h-6 text-xs w-full bg-blue-600 hover:bg-blue-500">Create</Button>
                  <Button type="button" size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-xs text-zinc-500 hover:text-white h-8 px-2"
                onClick={(e) => { e.preventDefault(); setIsCreating(true); }}
              >
                <Plus className="w-3 h-3 mr-2" /> New Project
              </Button>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}