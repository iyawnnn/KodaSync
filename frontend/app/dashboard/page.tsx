"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import NoteCreator from "@/components/NoteCreator";
import SearchBar from "@/components/SearchBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  
  // 1. STATE FOR TABS AND EDITING
  const [activeTab, setActiveTab] = useState("search");
  const [noteToEdit, setNoteToEdit] = useState<any>(null);

  useEffect(() => {
    const savedToken = Cookies.get("token");
    if (!savedToken) router.push("/");
    else setToken(savedToken);
  }, [router]);

  // 2. FUNCTION TO HANDLE EDIT CLICK
  const handleEditRequest = (note: any) => {
    setNoteToEdit(note);   // Load the data
    setActiveTab("create"); // Switch the view
  };

  // 3. FUNCTION WHEN SAVE IS COMPLETE
  const handleSaveComplete = () => {
    setNoteToEdit(null);   // Clear the editor
    setActiveTab("search"); // Go back to results to see the update
  };

  if (!token) return <div className="p-10 text-white">Loading Security Clearance...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              KodaSync Vault
            </h1>
            <p className="text-zinc-400 text-sm">Secure AI Knowledge Base</p>
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => { Cookies.remove("token"); router.push("/"); }}
          >
            Logout
          </Button>
        </header>

        {/* CONTROLLED TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border-zinc-800">
            <TabsTrigger value="search">🔍 Search Memory</TabsTrigger>
            <TabsTrigger value="create">
              {noteToEdit ? "✏️ Edit Memory" : "➕ Add Knowledge"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            {/* Pass the handleEditRequest function down */}
            <SearchBar onEdit={handleEditRequest} />
          </TabsContent>

          <TabsContent value="create">
            {/* Pass the noteToEdit data and the success callback */}
            <NoteCreator 
              initialData={noteToEdit} 
              onSuccess={handleSaveComplete}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}