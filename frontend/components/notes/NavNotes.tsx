"use client"

import { MoreHorizontal, Trash2, Pencil, Copy, FileCode, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { useState } from "react"
import api from "@/lib/api"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function NavNotes({ notes, onUpdate }: { notes: any[], onUpdate: () => void }) {
  const { isMobile } = useSidebar()
  const [editingNote, setEditingNote] = useState<any>(null)
  const [newTitle, setNewTitle] = useState("")
  const [loading, setLoading] = useState(false)

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await api.delete(`/notes/${id}`)
        toast.success("Note deleted")
        onUpdate()
      } catch (e) {
        toast.error("Failed to delete")
      }
    }
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success("Code copied to clipboard")
  }

  const startRename = (note: any) => {
    setEditingNote(note)
    setNewTitle(note.title)
  }

  const saveRename = async () => {
    if (!editingNote || !newTitle) return
    setLoading(true)
    try {
      await api.put(`/notes/${editingNote.id}`, { title: newTitle })
      toast.success("Note renamed")
      onUpdate()
      setEditingNote(null)
    } catch (e) {
      toast.error("Failed to rename")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Saved Notes</SidebarGroupLabel>
        <SidebarMenu>
          {notes.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton asChild>
                {/* 🚀 Clicking opens the note in Studio (assuming query param or state handling) */}
                <a href={`/dashboard/studio?noteId=${item.id}`}>
                  <FileCode className="text-zinc-500" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" side={isMobile ? "bottom" : "right"} align={isMobile ? "end" : "start"}>
                  <DropdownMenuItem onClick={() => handleCopy(item.code_snippet)}>
                    <Copy className="text-zinc-500" />
                    <span>Copy Code</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => startRename(item)}>
                    <Pencil className="text-zinc-500" />
                    <span>Rename</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDelete(item.id)}>
                    <Trash2 className="text-red-500" />
                    <span className="text-red-500">Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      {/* Rename Dialog */}
      <Dialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Rename Note</DialogTitle>
                <DialogDescription>Enter a new name for your note.</DialogDescription>
            </DialogHeader>
            <div className="py-2">
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Note title..." />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setEditingNote(null)}>Cancel</Button>
                <Button onClick={saveRename} disabled={loading}>{loading && <Loader2 className="w-4 h-4 animate-spin mr-2"/>} Save</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}