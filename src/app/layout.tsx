import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Meridian Runtime",
  description: "Event-driven command center for agentic workflows. Business objectives achieved through process design, policy, and human-in-the-loop decision making.",
  keywords: ["AI", "Agent", "Workflow", "Command Center", "Event-Driven", "Meridian"],
  authors: [{ name: "Meridian Runtime" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${ibmPlexMono.variable} antialiased`}
        style={{ fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace" }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
