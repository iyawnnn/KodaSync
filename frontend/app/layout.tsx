import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. BEST PRACTICE: Define the base URL for social images to work
export const metadata: Metadata = {
  metadataBase: new URL("https://kodasync.com"),
  
  title: {
    default: "KodaSync | AI-Powered Second Brain for Developers",
    template: "%s | KodaSync", // This allows sub-pages to have titles like "Dashboard | KodaSync"
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
  
  // Open Graph (Facebook, LinkedIn, Slack previews)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kodasync.com",
    title: "KodaSync | Your Organization's Engineering Memory",
    description: "Don't let knowledge leak. Sync snippets, search with AI, and retain your team's best code logic in one secure workspace.",
    siteName: "KodaSync",
    images: [
      {
        url: "/og-image.png", // You should add a 1200x630px image to your public folder
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

// 2. BEST PRACTICE: Separate viewport export (Next.js 14+)
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}