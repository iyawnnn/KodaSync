"use client";

import { useState } from "react";
import axios, { isAxiosError } from "axios"; // Import isAxiosError
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // Assuming you have Sonner installed

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // We can remove local 'error' state if we are using Toasts, 
  // but keeping it for the text below the button is fine too.
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Create URLSearchParams (Required for OAuth2 Form Data)
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);

      // 2. Send Request using Dynamic URL
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const response = await axios.post(
        `${API_URL}/auth/login`,
        params,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      // 3. Store tokens
      Cookies.set("token", response.data.access_token, { expires: 1/96 }); // 15 mins
      Cookies.set("refresh_token", response.data.refresh_token, { expires: 7 }); // 7 days

      toast.success("Welcome back!");
      
      // 4. Redirect
      router.push("/dashboard");

    } catch (err: any) {
      // 4. FRIENDLY ERROR HANDLING
      let errorMessage = "Something went wrong. Please try again.";

      if (isAxiosError(err)) {
          if (err.response) {
              // The server responded with a status code (e.g. 401 Unauthorized)
              errorMessage = err.response.data.detail || "Invalid email or password.";
          } else if (err.request) {
              // The request was made but no response was received
              errorMessage = "Cannot connect to server. Is the backend running?";
          }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Login Error:", err);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white p-4">
      {/* Added subtle background gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600 opacity-50" />
      
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 backdrop-blur-sm text-zinc-100 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold text-white tracking-tight">
            KodaSync Login
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Enter your credentials to access your Second Brain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold transition-all shadow-lg hover:shadow-blue-900/20"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-zinc-800 pt-6">
          <Link
            href="/auth/signup"
            className="text-sm text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4 hover:decoration-white"
          >
            Need an account? Sign Up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}