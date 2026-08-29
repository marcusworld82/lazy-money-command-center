import { GlassPanel } from "@/components/ui/glass-panel";
import { MONEY_GAP_MODULES } from "@/lib/sample-data";

export function MoneyGapModules() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
        The 7-Part Money Gap System
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MONEY_GAP_MODULES.map((module) => (
          <GlassPanel key={module.id} interactive className="flex flex-col gap-1.5 p-4">
            <h3 className="font-heading text-sm font-semibold">{module.label}</h3>
            <p className="text-xs text-foreground/55">{module.detail}</p>
          </GlassPanel>
        ))}
      </div>
    </section>
  );
}
