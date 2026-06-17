import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Meridian Runtime",
  description: "Event-driven command center for agentic workflows. Business objectives achieved through process design, policy, and human-in-the-loop decision making.",
  keywords: ["AI", "Agent", "Workflow", "Command Center", "Event-Driven", "Meridian"],
  authors: [{ name: "Meridian Runtime" }],
  icons: {
    icon: "/icon.svg",
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
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif" }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
