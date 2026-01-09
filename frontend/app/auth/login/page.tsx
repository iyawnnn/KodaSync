"use client";

import { useState } from "react";
import axios, { isAxiosError } from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  Zap,
  Eye,
  EyeOff,
  ChevronLeft,
} from "lucide-react";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleGitHubLogin = () => {
    window.location.href = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    }/auth/github/login`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await axios.post(`${API_URL}/auth/login`, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      Cookies.set("token", response.data.access_token, { expires: 1 / 96 });
      Cookies.set("refresh_token", response.data.refresh_token, { expires: 7 });

      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: any) {
      let errorMessage = "Something went wrong.";
      if (isAxiosError(err)) {
        errorMessage =
          err.response?.data?.detail || "Invalid email or password.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-white">
      {/* LEFT COLUMN: Form Area */}
      <div className="flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-20 xl:px-24 h-full relative z-10">
        {/* BACK TO HOME LINK */}
        <div className="absolute top-6 left-6 md:top-10 md:left-10 z-20">
          <Link
            href="/"
            className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm lg:max-w-[400px]">
          {/* LOGO SECTION UPDATE */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative w-10 h-10">
              <Image
                src="/logo.png"
                alt="KodaSync Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">
              KodaSync
            </span>
          </div>

          <div className="space-y-2 text-left mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500">
              Enter your details to access your workspace.
            </p>
          </div>

          <div className="grid gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={handleGitHubLogin}
              className="w-full h-10 bg-white hover:bg-gray-50 text-gray-700 border-gray-200 font-medium transition-all"
            >
              <GithubIcon className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 border-gray-200 focus-visible:ring-green-600 transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={isVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 border-gray-200 focus-visible:ring-green-600 transition-all pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={toggleVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 outline-none"
                  >
                    {isVisible ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-2.5 text-xs text-red-500 bg-red-50 border border-red-100 rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-bold transition-all shadow-lg shadow-green-600/20"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-500 pb-2">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-semibold text-green-600 hover:text-green-500 hover:underline"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Value Proposition */}
      <div className="hidden lg:block relative bg-zinc-900 overflow-hidden h-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-green-900/30 via-zinc-900 to-black" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 mix-blend-overlay"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[120px] animate-pulse" />

        <div className="absolute inset-0 flex flex-col justify-between p-16 text-white z-20">
          <div className="flex justify-end"></div>

          <div className="max-w-lg space-y-8">
            <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl">
              <Zap className="w-7 h-7 text-green-400 fill-green-400/20" />
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight leading-tight">
                Capture at the <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                  speed of thought.
                </span>
              </h2>
              <p className="text-base text-zinc-400 leading-relaxed max-w-sm">
                Your second brain should be as fast as your first. KodaSync
                helps you organize code, notes, and ideas without breaking your
                flow.
              </p>
            </div>

            <div className="pt-4 flex gap-8 border-t border-white/10">
              <div>
                <div className="text-2xl font-bold text-white">0.1s</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                  Latency
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                  Offline Support
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
