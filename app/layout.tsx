import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Party Accounts — Dawat IT & Consultancy",
  description: "পাওনা ও দেনার হিসাব, পার্টি লেজার এবং রিপোর্ট।",
  applicationName: "Party Accounts",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2a1765",
};

// This is an authenticated accounting app; render routes at request time rather
// than producing stale static shells during deployment.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn">
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
