import type { ReactNode } from "react";
import { MarcoShell } from "@/components/marco/marco-shell";

export function AppShell({ children }: { children: ReactNode }) {
  return <MarcoShell>{children}</MarcoShell>;
}
