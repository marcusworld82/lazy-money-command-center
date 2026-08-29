import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { GlobalCommandBar } from "@/components/layout/global-command-bar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh w-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <GlobalCommandBar />
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
