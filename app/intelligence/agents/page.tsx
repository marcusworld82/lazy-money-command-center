import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { SAMPLE_AGENTS } from "@/lib/sample-data";
import { Bot } from "lucide-react";

export default function AgentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit text-[11px] uppercase tracking-wider">
          Intelligence
        </Badge>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Agents
        </h1>
        <p className="max-w-xl text-sm text-foreground/60">
          Agent registry, roles, and character-style avatars land in Phase 6, alongside the
          Hermes runtime and learning loop.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SAMPLE_AGENTS.map((agent) => (
          <Panel key={agent.id} className="flex flex-col items-center gap-2 p-5 text-center">
            <div className="flex size-14 items-center justify-center rounded-full border border-subtle bg-white/5">
              <Bot className="size-6 text-foreground/50" />
            </div>
            <span className="font-heading text-sm font-semibold">{agent.name}</span>
            <span className="text-xs text-foreground/55">{agent.role}</span>
            <Badge variant="secondary" className="text-[10px]">
              Coming Soon
            </Badge>
          </Panel>
        ))}
      </div>
    </div>
  );
}
