"use client";

import { LogOut, Settings, User } from "lucide-react";
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

const ICON_STROKE = 1.5;

interface NavUserProps {
  user: { name: string; email: string; avatar?: string };
  collapsed?: boolean;
}

export function NavUser({ user, collapsed }: NavUserProps) {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove("token");
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative group outline-none rounded-lg transition-all">
          {/* Reduced size to size-8 (32px) to fit in 48px rail with margin */}
          <Avatar className="size-8 rounded-lg border border-transparent hover:border-border/50 transition-all">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-lg bg-secondary text-secondary-foreground font-medium text-[10px]">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56 rounded-lg p-1.5 border-border/50 shadow-lg"
        side="right"
        align="end"
        sideOffset={10}
      >
        <div className="flex items-center gap-2 p-2 pb-2">
          <Avatar className="size-8 rounded-md">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="rounded-md bg-secondary text-xs">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium text-foreground">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
        
        <DropdownMenuSeparator className="bg-border/50" />
        
        <DropdownMenuItem className="cursor-pointer text-xs font-medium">
            <User className="mr-2 size-3.5" strokeWidth={ICON_STROKE} />
            Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-xs font-medium">
            <Settings className="mr-2 size-3.5" strokeWidth={ICON_STROKE} />
            Settings
        </DropdownMenuItem>

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