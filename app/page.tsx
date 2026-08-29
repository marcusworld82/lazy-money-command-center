import { GlassPanel } from "@/components/ui/glass-panel";
import { StatCard } from "@/components/ui/stat-card";
import { ProjectCard } from "@/components/ui/project-card";
import { ActivityFeedItem } from "@/components/ui/activity-feed-item";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lightbulb, ListChecks, StickyNote, Workflow, FolderPlus, ImagePlus } from "lucide-react";
import {
  SAMPLE_PROJECTS,
  SAMPLE_ACTIVITY,
  SAMPLE_BUSINESS_PULSE,
  SAMPLE_TASK_PROGRESS,
} from "@/lib/sample-data";

const QUICK_CAPTURE = [
  { label: "Idea", icon: Lightbulb, placeholder: "Capture an idea…" },
  { label: "Task", icon: ListChecks, placeholder: "Add a task…" },
  { label: "Note", icon: StickyNote, placeholder: "Jot a note…" },
];

export default function CommandCenterPage() {
  return (
    <div className="flex flex-col gap-6">
      <GlassPanel className="flex flex-col gap-2 p-6 md:p-8">
        <span className="text-xs font-medium uppercase tracking-wider text-foreground/55">
          Daily Focus
        </span>
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          Run every business from one command center.
        </h1>
        <p className="max-w-2xl text-sm text-foreground/60 md:text-base">
          Sample data only — this is the Phase 1 foundation shell. Real projects, tasks,
          and activity connect in Phase 2.
        </p>
      </GlassPanel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="flex flex-col gap-3 xl:col-span-2">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Priority Projects
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SAMPLE_PROJECTS.slice(0, 4).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Task Progress
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {SAMPLE_TASK_PROGRESS.map((t) => (
              <StatCard key={t.label} label={t.label} value={String(t.count)} />
            ))}
          </div>

          <h2 className="mt-2 font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Business Pulse
          </h2>
          <div className="flex flex-col gap-2">
            {SAMPLE_BUSINESS_PULSE.map((b) => (
              <GlassPanel key={b.workspace} className="flex flex-col gap-0.5 p-3">
                <span className="text-sm font-medium">{b.label}</span>
                <span className="text-xs text-foreground/55">{b.status}</span>
                <span className="text-xs text-foreground/40">{b.metric}</span>
              </GlassPanel>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Command Activity Feed
          </h2>
          <GlassPanel className="p-4">
            <ul className="flex flex-col">
              {SAMPLE_ACTIVITY.map((item) => (
                <ActivityFeedItem key={item.id} item={item} />
              ))}
            </ul>
          </GlassPanel>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Quick Capture
          </h2>
          <GlassPanel className="flex flex-col gap-3 p-4">
            {QUICK_CAPTURE.map(({ label, icon: Icon, placeholder }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="size-4 shrink-0 text-foreground/50" />
                <Input placeholder={placeholder} disabled className="bg-transparent" />
                <Button size="sm" variant="secondary" disabled>
                  + {label}
                </Button>
              </div>
            ))}
            <p className="text-xs text-foreground/40">
              Quick capture becomes functional in Phase 2.
            </p>
          </GlassPanel>
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Creative &amp; Workflow Studio
        </h2>
        <PlaceholderEmptyState
          icon={Workflow}
          title="Nothing in the studio yet"
          description="Start a new project, spin up a workflow, or add an asset to see it appear here."
          action={
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <Button size="sm" variant="secondary" disabled className="gap-1.5">
                <FolderPlus className="size-3.5" /> New Project
              </Button>
              <Button size="sm" variant="secondary" disabled className="gap-1.5">
                <Workflow className="size-3.5" /> New Workflow
              </Button>
              <Button size="sm" variant="secondary" disabled className="gap-1.5">
                <ImagePlus className="size-3.5" /> Add Asset
              </Button>
            </div>
          }
        />
      </section>
    </div>
  );
}
