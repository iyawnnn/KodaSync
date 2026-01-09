"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
import Image from "next/image";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    if (accessToken && refreshToken) {
      // Set cookies with security flags
      Cookies.set("token", accessToken, { 
        expires: 1 / 96, // 15 mins
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" 
      });
      
      Cookies.set("refresh_token", refreshToken, { 
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" 
      });

      // Redirect using replace to clean browser history
      setTimeout(() => {
        router.replace("/dashboard");
      }, 800);
    } else {
      router.replace("/auth/login?error=GitHubAuthFailed");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-green-100/40 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-50/60 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500">
        <div className="mb-8 relative h-16 w-16 rounded-2xl overflow-hidden shadow-xl shadow-green-200 animate-bounce bg-white">
          <Image
            src="/logo.png"
            alt="KodaSync application logo"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-col items-center space-y-3 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Setting up your workspace
          </h2>
          <p className="text-gray-500 max-w-xs">
            Verifying your credentials and syncing your profile...
          </p>
        </div>

        <div className="mt-8">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}