import type { Metadata } from "next";
import { Suspense } from "react";
import { Archivo } from "next/font/google";
import "./globals.css";
import "@xyflow/react/dist/style.css";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { AppDataProvider } from "@/lib/providers/app-data-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/app-shell";

const archivo = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MARCO — Command Center",
  description: "Thread-first command center for every brand Marcus runs.",
  manifest: "/manifest.json",
  icons: { apple: "/apple-touch-icon.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            <AppDataProvider><Suspense fallback={null}><AppShell>{children}</AppShell></Suspense></AppDataProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
