"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, BrainCircuit } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-blue-500/30">
      
      {/* Navbar Placeholder */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-800/50">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Code2 className="text-white h-5 w-5" />
          </div>
          <span>KodaSync</span>
        </div>
        <div className="flex gap-4">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              Log in
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-white text-black hover:bg-zinc-200 font-medium">
              Sign Up
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400 mb-4">
            <BrainCircuit className="h-3 w-3 text-blue-500" />
            <span>AI-Powered Second Brain for Developers</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
            Never lose a <br /> snippet again.
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
            Store, search, and fix your code snippets instantly. 
            KodaSync uses vector embeddings to understand what your code <em>does</em>, not just what it says.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/auth/signup">
              <Button size="lg" className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-500 text-white rounded-full">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white rounded-full bg-transparent">
                Existing User?
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8 text-center text-zinc-600 text-sm">
        <p>&copy; 2026 KodaSync Inc. Built for developers.</p>
      </footer>
    </div>
  );
}