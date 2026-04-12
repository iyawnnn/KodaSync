"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    // Determine the user's auth state to prevent unauthorized dashboard routing
    const token = Cookies.get("token");
    setDestination(token ? "/dashboard" : "/auth/login");
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#fafafa] font-sans overflow-hidden">
      {/* High-end Ambient Background Blurs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-zinc-200/50 blur-[100px] rounded-full pointer-events-none z-0 mix-blend-multiply" />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        
        {/* Floating Icon */}
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white border border-zinc-200/80 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100">
            <Compass className="h-6 w-6 text-zinc-400" strokeWidth={1.5} />
          </div>
        </div>
        
        <h1 className="text-[120px] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-500 tracking-tighter mb-4">
          404
        </h1>
        
        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mb-4">
          Lost in the void
        </h2>
        
        <p className="max-w-[380px] text-base text-zinc-500 font-medium leading-relaxed mb-10">
          We couldn't find the page you're looking for. It may have been relocated, deleted, or perhaps it never existed.
        </p>

        <div className="flex gap-4">
          <Button 
            onClick={() => window.history.back()}
            variant="outline" 
            className="h-12 px-6 gap-2 rounded-xl border-zinc-200 font-bold hover:bg-zinc-50 text-zinc-700 transition-all shadow-sm"
          >
            Go Back
          </Button>
          
          {/* Dynamically render the primary action once state is determined */}
          {destination && (
            <Link href={destination} passHref>
              <Button className="h-12 px-6 gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm hover:shadow hover:-translate-y-[1px] transition-all">
                <ArrowLeft className="h-4 w-4" />
                {destination === "/dashboard" ? "Return to Workspace" : "Sign In"}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}