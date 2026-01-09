"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Terminal, 
  Zap, 
  ShieldCheck, 
  Code
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-green-500 selection:text-white">
      
      {/* --- NAVBAR --- */}
      <header className="fixed top-0 w-full z-50 border-b border-black bg-white/90 backdrop-blur-md h-16 flex items-center transition-all duration-300">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
             <div className="relative w-7 h-7 md:w-8 md:h-8">
               <Image src="/logo.png" alt="KodaSync" fill className="object-contain" />
             </div>
             <span className="font-bold text-lg md:text-xl tracking-tighter">KodaSync</span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            {/* UPDATED: Removed 'hidden sm:block' so it shows on mobile */}
            <Link href="/auth/login" className="text-sm font-medium hover:underline decoration-green-600 underline-offset-4">
              Sign In
            </Link>
            <Link href="/auth/signup">
              <Button className="h-9 md:h-10 rounded-none bg-black text-white hover:bg-green-600 hover:text-black border border-black transition-all font-bold px-4 md:px-6 text-xs md:text-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* --- MAIN GRID CONTAINER --- */}
      <main className="pt-16 w-full max-w-[1400px] mx-auto border-x border-black min-h-screen">
        
        {/* SECTION 1: ASYMMETRIC HERO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-black">
          
          {/* LEFT: THE MANIFESTO */}
          <div className="lg:col-span-7 p-6 md:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-black bg-white relative overflow-hidden">
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:2rem_2rem] -z-10"></div>

             <div className="space-y-6 md:space-y-8">
               <div className="inline-block bg-green-100 border border-green-600 px-3 py-1 text-[10px] md:text-xs font-bold text-green-800 uppercase tracking-widest">
                  System Status: Operational
               </div>
               
               <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.95] md:leading-[0.9]">
                 CODE.<br/>
                 SYNC.<br/>
                 <span className="text-green-600">RETAIN.</span>
               </h1>

               <p className="text-lg md:text-xl lg:text-2xl font-medium text-zinc-600 max-w-lg leading-snug">
                 Your organization is leaking knowledge. KodaSync captures your engineering team&apos;s collective intelligence in real-time.
               </p>

               <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="/auth/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto h-12 md:h-14 px-8 rounded-none bg-green-600 text-white border border-transparent hover:bg-black hover:border-green-600 transition-colors text-base md:text-lg font-bold">
                       Deploy Workspace
                    </Button>
                  </Link>
                  <div className="flex items-center justify-center sm:justify-start gap-2 px-4 text-sm font-medium text-zinc-500 py-2 sm:py-0">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Enterprise Grade Security</span>
                  </div>
               </div>
             </div>
          </div>

          {/* RIGHT: THE VISUAL ENGINE */}
          <div className="lg:col-span-5 bg-zinc-50 p-6 md:p-8 flex flex-col relative overflow-hidden min-h-[300px]">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
             
             <div className="mb-6 flex justify-between items-end border-b border-zinc-300 pb-2">
                <span className="font-mono text-[10px] md:text-xs text-zinc-500">LIVE_INGEST :: STREAM</span>
                <div className="flex gap-1">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   <span className="font-mono text-[10px] md:text-xs text-green-600">ACTIVE</span>
                </div>
             </div>

             <div className="space-y-3 md:space-y-4 opacity-90 mask-image-b">
                {[
                  { lang: "TypeScript", title: "Auth Middleware Hook", time: "2m ago" },
                  { lang: "Python", title: "Pandas Cleaning Pipeline", time: "14m ago" },
                  { lang: "Rust", title: "Memory Safe Pointer Logic", time: "1h ago" },
                  { lang: "SQL", title: "Complex Join User Analytics", time: "2h ago" },
                ].map((item, i) => (
                  <div key={i} className="bg-white border border-black p-3 md:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 transition-transform cursor-default">
                     <div className="flex justify-between mb-2">
                        <span className="text-[10px] md:text-xs font-bold bg-zinc-100 px-2 py-1">{item.lang}</span>
                        <span className="text-[10px] md:text-xs font-mono text-zinc-400">{item.time}</span>
                     </div>
                     <div className="font-mono text-xs md:text-sm font-semibold truncate">{item.title}</div>
                     <div className="mt-2 h-1.5 md:h-2 w-3/4 bg-zinc-100 rounded-full"></div>
                     <div className="mt-1 h-1.5 md:h-2 w-1/2 bg-zinc-100 rounded-full"></div>
                  </div>
                ))}
                
                <div className="border-t border-dashed border-zinc-400 pt-4 text-center">
                   <p className="font-mono text-[10px] md:text-xs text-zinc-500">Syncing across 4 devices...</p>
                </div>
             </div>
          </div>
        </div>

        {/* SECTION 2: THE "WHY" BAR */}
        <div className="bg-black text-white grid grid-cols-2 md:grid-cols-4 border-b border-black">
           {[
             { label: "Latency", val: "10ms" },
             { label: "Uptime", val: "99.9%" },
             { label: "Languages", val: "50+" },
             { label: "Encryption", val: "AES-256" }
           ].map((stat, i) => (
             <div key={i} className={`p-6 md:p-8 flex flex-col items-center justify-center text-center ${i % 2 === 0 ? 'border-r md:border-r-0' : ''} md:border-r border-zinc-800 last:border-r-0`}>
                <span className="text-zinc-500 text-[10px] md:text-xs font-mono uppercase tracking-widest mb-1">{stat.label}</span>
                <span className="text-2xl md:text-4xl font-bold text-green-500">{stat.val}</span>
             </div>
           ))}
        </div>

        {/* SECTION 3: FEATURE ARCHITECTURE */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-black">
           <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-black hover:bg-zinc-50 transition-colors group">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 border border-green-600 flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                 <Terminal className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3">Contextual Embeddings</h3>
              <p className="text-sm md:text-base text-zinc-600 leading-relaxed">
                 We don't just match keywords. KodaSync uses vector search to understand the <em>intent</em> behind your code, allowing you to find logic even if you forgot the function name.
              </p>
           </div>
           <div className="p-8 md:p-12 hover:bg-zinc-50 transition-colors group">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 border border-green-600 flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                 <Zap className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3">Zero-Friction Capture</h3>
              <p className="text-sm md:text-base text-zinc-600 leading-relaxed">
                 Integrated directly into your workflow. Save snippets from your IDE, terminal, or browser with a single keystroke. No context switching required.
              </p>
           </div>
        </div>

        {/* SECTION 4: THE PROBLEM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-black">
           <div className="lg:col-span-4 bg-zinc-100 p-8 md:p-10 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-black">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6">The Cost of Chaos.</h2>
              <p className="text-base md:text-lg font-medium text-zinc-500">
                 Every time a developer re-solves a solved problem, your business loses money.
              </p>
           </div>
           
           <div className="lg:col-span-8 bg-white p-8 md:p-10 flex flex-col justify-center">
              <div className="space-y-6 md:space-y-8">
                 <div className="flex gap-4 md:gap-6 items-start">
                    <div className="mt-1 font-mono text-green-600 font-bold text-sm md:text-base">01</div>
                    <div>
                       <h4 className="text-lg md:text-xl font-bold mb-2">Knowledge Fragmentation</h4>
                       <p className="text-sm md:text-base text-zinc-600">Snippets live in Slack, Jira tickets, and local text files. KodaSync centralizes them into a single source of truth.</p>
                    </div>
                 </div>
                 <div className="w-full h-px bg-zinc-200"></div>
                 <div className="flex gap-4 md:gap-6 items-start">
                    <div className="mt-1 font-mono text-green-600 font-bold text-sm md:text-base">02</div>
                    <div>
                       <h4 className="text-lg md:text-xl font-bold mb-2">Onboarding Latency</h4>
                       <p className="text-sm md:text-base text-zinc-600">New hires spend weeks learning your codebase&apos;s quirks. With KodaSync, the &quot;How do I...?&quot; answers are already indexed.</p>
                    </div>
                 </div>
                 <div className="w-full h-px bg-zinc-200"></div>
                 <div className="flex gap-4 md:gap-6 items-start">
                    <div className="mt-1 font-mono text-green-600 font-bold text-sm md:text-base">03</div>
                    <div>
                       <h4 className="text-lg md:text-xl font-bold mb-2">Code Duplication</h4>
                       <p className="text-sm md:text-base text-zinc-600">Prevent different teams from building the same utility functions twice. Promote reuse by default.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* SECTION 5: CTA */}
        <div className="bg-green-600 text-white p-12 md:p-32 text-center relative overflow-hidden">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
           <div className="relative z-10 max-w-3xl mx-auto space-y-6 md:space-y-8">
              <Code className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4" />
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter">
                 BUILD FASTER. TOGETHER.
              </h2>
              <p className="text-lg md:text-xl text-green-50 font-medium">
                 Join the new standard of engineering memory. Open source friendly, enterprise ready.
              </p>
              <div className="pt-8">
                 <Link href="/auth/signup">
                    <Button className="h-14 md:h-16 w-full sm:w-auto px-8 md:px-12 text-lg md:text-xl bg-black text-white hover:bg-white hover:text-black border border-black rounded-none transition-all font-bold shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
                       Create Free Account
                       <ArrowRight className="ml-2 w-5 h-5 md:w-6 md:h-6" />
                    </Button>
                 </Link>
              </div>
           </div>
        </div>

      </main>

      {/* --- FOOTER (RESTRUCTURED FOR MOBILE ORDER) --- */}
      <footer className="w-full max-w-[1400px] mx-auto border-x border-b border-black bg-white py-8 px-6">
         <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
            
            {/* MOBILE ORDER: 1 (Top)
              DESKTOP ORDER: 1 (Left)
            */}
            <div className="flex items-center justify-center md:justify-start gap-3 order-1 md:order-1">
               <div className="relative w-6 h-6">
                  <Image src="/logo.png" alt="KodaSync" fill className="object-contain" />
               </div>
               <span className="font-bold text-lg tracking-tight font-sans">KodaSync</span>
            </div>

            {/* MOBILE ORDER: 2 (Middle) 
              DESKTOP ORDER: 3 (Right)
            */}
            <div className="text-center md:text-right order-2 md:order-3">
               <p className="text-xs text-zinc-500 font-medium font-sans">
                  Designed & Developed by{" "}
                  <a 
                    href="https://github.com/iyawnnn" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline decoration-green-600 underline-offset-2 hover:text-black hover:bg-green-100 transition-colors"
                  >
                    Ian Macabulos
                  </a>
               </p>
            </div>

            {/* MOBILE ORDER: 3 (Bottom) 
              DESKTOP ORDER: 2 (Center)
            */}
            <div className="text-center order-3 md:order-2">
               <p className="text-xs text-zinc-500 font-sans">
                  © 2026 KodaSync. All rights reserved.
               </p>
            </div>

         </div>
      </footer>
    </div>
  );
}