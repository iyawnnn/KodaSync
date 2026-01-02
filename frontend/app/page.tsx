"use client";

import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true); // <--- TOGGLE STATE
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const formData = new FormData();
        formData.append("username", email);
        formData.append("password", password);

        const response = await axios.post("http://localhost:8000/auth/login", formData, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        Cookies.set("token", response.data.access_token, { expires: 1 });
        router.push("/dashboard");

      } else {
        // --- SIGN UP LOGIC ---
        await axios.post("http://localhost:8000/auth/signup", {
          email,
          password
        });
        
        setSuccessMsg("Account created! Logging you in...");
        
        // Auto-login after signup
        setIsLogin(true); 
        // We trigger the login logic immediately or let user click login. 
        // For simplicity, let's just switch them to login view and show success.
        setLoading(false);
        return; 
      }

    } catch (err: any) {
      console.error(err);
      if (isLogin) {
        setError("Invalid email or password.");
      } else {
        setError(err.response?.data?.detail || "Failed to create account.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold text-white">
            {isLogin ? "KodaSync Login" : "Join KodaSync"}
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            {isLogin 
              ? "Enter your credentials to access your Second Brain." 
              : "Create a secure account to start syncing knowledge."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
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
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {successMsg && <p className="text-green-500 text-sm text-center">{successMsg}</p>}

            <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200" disabled={loading}>
              {loading ? "Connecting..." : (isLogin ? "Sign In" : "Create Account")}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t border-zinc-800 pt-6">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(""); setSuccessMsg(""); }}
            className="text-sm text-zinc-500 hover:text-white transition-colors underline"
          >
            {isLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}