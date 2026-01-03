"use client";

import { useState } from "react";
import axios from "axios";
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

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await axios.post("http://localhost:8000/auth/signup", {
        email,
        password,
      });

      setSuccessMsg("Account created! Please log in.");
      // Optional: Auto-clear fields
      setEmail("");
      setPassword("");
    } catch (err: any) {
      if (err.response && err.response.status === 400) {
        setError(err.response.data.detail || "Account creation failed.");
      } else {
        console.error("Signup Error:", err);
        setError("Something went wrong. Please try again.");
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
            Join KodaSync
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Create a secure account to start syncing knowledge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-blue-600"
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
                className="bg-zinc-800 border-zinc-700 text-white focus-visible:ring-blue-600"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            {successMsg && (
              <div className="text-green-500 text-sm text-center space-y-2">
                <p>{successMsg}</p>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full border-green-900 bg-green-900/20 text-green-400 hover:bg-green-900/40 hover:text-green-300">
                    Go to Login
                  </Button>
                </Link>
              </div>
            )}

            {!successMsg && (
              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-zinc-200 font-bold"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            )}
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-zinc-800 pt-6">
          <Link
            href="/auth/login"
            className="text-sm text-zinc-500 hover:text-white transition-colors underline"
          >
            Already have an account? Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}