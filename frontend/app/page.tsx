"use client";

import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie"; // <--- 1. NEW IMPORT
import { useRouter } from "next/navigation"; // <--- 2. NEW IMPORT
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter(); // <--- 3. Initialize Router
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const response = await axios.post("http://localhost:8000/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const token = response.data.access_token;
      
      // --- 4. NEW LOGIC STARTS HERE ---
      // Save token to cookies (expires in 1 day)
      Cookies.set("token", token, { expires: 1 });
      
      // Redirect to the dashboard
      router.push("/dashboard");
      // --------------------------------

    } catch (err: any) {
      console.error(err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ... (Rest of the JSX return statement remains the same) ...
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white p-4">
      {/* ... keeping your existing Card code ... */}
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold text-white">
            KodaSync
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

            <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200" disabled={loading}>
              {loading ? "Connecting..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}