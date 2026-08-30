import { redirect } from "next/navigation";

/**
 * The Phase 4.5 sidebar is tool-first and has no Command Center entry, so the
 * root URL forwards to Super Agent — the spec's stated "entry point to the
 * platform". The old workspace-pulse dashboard is retired along with the four
 * business workspaces.
 */
export default function RootPage() {
  redirect("/super-agent");
}
