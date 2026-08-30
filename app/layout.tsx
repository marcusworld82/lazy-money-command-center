import type { Metadata } from "next";
import { Geist, Geist_Mono, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import "@xyflow/react/dist/style.css";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { SidebarProvider } from "@/lib/providers/sidebar-provider";
import { AppDataProvider } from "@/lib/providers/app-data-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/app-shell";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Bold condensed display face for headlines (Phase 4.5 typography). */
const headingFont = Barlow_Condensed({
  variable: "--font-heading-family",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lazy Money OS Command Center",
  description: "Personal operating system for running multiple businesses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${headingFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            <SidebarProvider>
              <AppDataProvider>
                <AppShell>{children}</AppShell>
              </AppDataProvider>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
