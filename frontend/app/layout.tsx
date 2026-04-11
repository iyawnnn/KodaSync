import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { GlobalCommand } from "@/components/shared/GlobalCommand";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "KodaSync | AI-Powered Second Brain for Developers",
    template: "%s | KodaSync",
  },
  description: "Stop re-Googling the same code. KodaSync is the AI-powered snippet manager that captures, indexes, and retrieves your engineering team's collective intelligence using vector search.",
  keywords: [
    "code snippet manager",
    "developer second brain",
    "vector search for code",
    "engineering knowledge base",
    "developer productivity tools",
    "AI code search",
    "KodaSync"
  ],
  authors: [{ name: "KodaSync Team" }],
  creator: "Ian Macabulos",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    title: "KodaSync | Your Organization's Engineering Memory",
    description: "Don't let knowledge leak. Sync snippets, search with AI, and retain your team's best code logic in one secure workspace.",
    siteName: "KodaSync",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KodaSync Dashboard Preview",
      },
    ],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png", 
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} font-sans antialiased`}
      >
        <GlobalCommand />
        {children}
        <Toaster />
      </body>
    </html>
  );
}