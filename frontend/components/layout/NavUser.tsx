"use client";

import { useEffect, useState } from "react";
import { LogOut, ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const ICON_STROKE = 1.5;

export function NavUser() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch User Data Internally (Fixes the undefined error)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser({
          name: res.data.full_name || "User",
          email: res.data.email,
          avatar: res.data.avatar_url,
        });
      } catch (e) {
        console.error("Failed to fetch user", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("refresh_token");
    router.push("/auth/login");
  };

  // 2. Loading State (Prevents crash while waiting for data)
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="space-y-1 flex-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-2 w-12" />
        </div>
      </div>
    );
  }

  // 3. Fallback if API fails
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative group flex items-center gap-3 w-full outline-none rounded-lg p-2 transition-all hover:bg-sidebar-accent/50">
          <Avatar className="size-8 rounded-lg border border-transparent group-hover:border-border/50 transition-all">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-lg bg-green-500/10 text-green-500 font-semibold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate font-semibold text-sm text-foreground">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
          
          <ChevronsUpDown className="ml-auto size-4 text-muted-foreground opacity-50 group-hover:opacity-100" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56 rounded-lg p-1.5 border-border/50 shadow-lg bg-popover"
        side="right"
        align="end"
        sideOffset={10}
      >
        <div className="flex items-center gap-2 p-2 pb-2">
          <Avatar className="size-8 rounded-md">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="rounded-md bg-green-500/10 text-green-500 text-xs">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium text-foreground">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
        
        <DropdownMenuSeparator className="bg-border/50" />

        <DropdownMenuItem 
            onClick={handleLogout} 
            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer text-xs font-medium"
        >
          <LogOut className="mr-2 size-3.5" strokeWidth={ICON_STROKE} />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}