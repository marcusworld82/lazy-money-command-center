import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { AUTO_ENGAGE_SECTIONS } from "@/lib/sample-data";

export default function AutoEngagePage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit text-[11px] uppercase tracking-wider">
          Module
        </Badge>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Auto-Engage
        </h1>
        <p className="max-w-xl text-sm text-foreground/60">
          Keyword-triggered DM automation for Instagram and Facebook. Shell only — build in
          draft/simulation mode first, per Meta&apos;s app review requirements.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {AUTO_ENGAGE_SECTIONS.map((section) => (
          <GlassPanel key={section.id} className="flex flex-col gap-1.5 p-4">
            <h2 className="font-heading text-sm font-semibold">{section.label}</h2>
            <p className="text-xs text-foreground/55">{section.detail}</p>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}
