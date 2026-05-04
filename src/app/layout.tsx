import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aftercare — AI Medication Compliance",
  description:
    "Scan your after-visit summary and let AI keep you on your meds with reminders, streaks, and behavioral nudges.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Aftercare",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b6fd1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <div className="mx-auto w-full max-w-md flex-1 flex flex-col pb-28">
            {children}
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
