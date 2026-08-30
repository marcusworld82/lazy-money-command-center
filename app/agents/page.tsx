import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { PageHero } from "@/components/layout/page-hero";
import { AGENT_LIST, AGENT_PHASE_LABEL } from "@/lib/agents";

/**
 * Agent roster (Phase 4.5 Part F).
 *
 * Four named placeholders so Phase 6 has concrete targets. Every card links to
 * the surface the agent will live on, and carries the "Coming in Phase 6" badge
 * per master spec §17 — none of these reason or call a model yet.
 */
export default function AgentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHero
        eyebrow="Roster"
        title="Agents"
        description="Four dedicated agents, each scoped to one surface. Names and scopes are fixed now so Phase 6 builds against a defined roster instead of inventing one."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {AGENT_LIST.map((agent) => {
          const Icon = agent.icon;
          return (
            <Panel
              key={agent.id}
              interactive
              as="article"
              className="flex flex-col gap-3 p-5"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-accent-brand/15 text-accent-brand">
                <Icon className="size-5" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-heading text-base font-semibold">{agent.name}</span>
                <span className="text-[11px] uppercase tracking-wider text-foreground/45">
                  {agent.livesIn}
                </span>
              </div>
              <p className="text-xs text-foreground/65">{agent.scope}</p>
              <p className="text-[11px] text-foreground/40">
                Modelled on {agent.behaviourModel}
              </p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                <Badge variant="tag" className="text-[10px]">
                  {AGENT_PHASE_LABEL}
                </Badge>
                <Link
                  href={agent.href}
                  className="text-[11px] text-accent-brand underline-offset-2 hover:underline"
                >
                  Open {agent.livesIn.split(" → ")[0]}
                </Link>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
