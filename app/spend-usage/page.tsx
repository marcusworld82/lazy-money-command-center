import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Panel } from "@/components/ui/panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SPEND_USAGE } from "@/lib/sample-data";
import { Wallet, Sparkles } from "lucide-react";

export default function SpendUsagePage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit text-[11px] uppercase tracking-wider">
          Module
        </Badge>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Spend &amp; Usage
        </h1>
        <p className="max-w-xl text-sm text-foreground/60">
          Real spend on OpenRouter and fal connects in Phase 5. All figures below are
          placeholders.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="OpenRouter Balance"
          value={SPEND_USAGE.openRouter.balance}
          icon={Wallet}
        />
        <StatCard
          label="OpenRouter — 30d Spend"
          value={SPEND_USAGE.openRouter.spend30d}
          icon={Wallet}
        />
        <StatCard label="fal Balance" value={SPEND_USAGE.fal.balance} icon={Sparkles} />
        <StatCard label="fal — 30d Spend" value={SPEND_USAGE.fal.spend30d} icon={Sparkles} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Model Usage
        </h2>
        <Panel className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SPEND_USAGE.modelUsage.map((row) => (
                <TableRow key={row.model}>
                  <TableCell className="font-medium">{row.model}</TableCell>
                  <TableCell>{row.tokens}</TableCell>
                  <TableCell className="text-right">{row.cost}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Media Generation Log
        </h2>
        <Panel className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SPEND_USAGE.mediaLog.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{row.job}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.cost}</TableCell>
                  <TableCell className="text-right">{row.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Agent Usage Ranking
        </h2>
        <Panel className="p-4">
          <p className="text-sm text-foreground/55">
            No agents active yet — ranking populates once agents exist in Phase 6.
          </p>
        </Panel>
      </section>
    </div>
  );
}
