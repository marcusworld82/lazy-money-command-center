"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Panel } from "@/components/ui/panel";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, Plus, Trash2, Pencil, Play, ShieldAlert } from "lucide-react";
import { FlowBuilder } from "@/components/features/automation/flow-builder";
import {
  listFlows,
  listAutomationLog,
  setFlowStatus,
  deleteFlow,
  simulateTrigger,
} from "@/lib/actions/automation";
import type {
  AutomationFlow,
  AutomationLogEntry,
  AutomationStatus,
} from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

const RESULT_LABEL: Record<AutomationLogEntry["result"], string> = {
  sent: "Sent",
  failed: "Failed",
  gated_not_following: "Gated — not following",
};

export default function AutoEngagePage() {
  const [flows, setFlows] = React.useState<AutomationFlow[]>([]);
  const [log, setLog] = React.useState<AutomationLogEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<
    null | { flow?: AutomationFlow }
  >(null);
  const [simulating, setSimulating] = React.useState<AutomationFlow | null>(null);
  const [simContact, setSimContact] = React.useState("@test_user");
  const [simFollows, setSimFollows] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [f, l] = await Promise.all([listFlows(), listAutomationLog()]);
      setFlows(f);
      setLog(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load automation data.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Deliberate: initial fetch-on-mount; Server Actions can't run during SSR render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  async function handleSimulate() {
    if (!simulating) return;
    await simulateTrigger({
      flowId: simulating.id,
      contactIdentifier: simContact.trim() || "@test_user",
      contactFollows: simFollows,
    });
    setSimulating(null);
    await refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit text-[11px] uppercase tracking-wider">
            Module
          </Badge>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Auto-Engage
          </h1>
          <p className="max-w-xl text-sm text-foreground/60">
            Keyword-triggered DM automation for Instagram and Facebook. Everything here runs
            in simulation only — no messages are sent.
          </p>
        </div>
        {!editing && (
          <Button size="sm" className="gap-1.5" onClick={() => setEditing({})}>
            <Plus className="size-3.5" /> New Flow
          </Button>
        )}
      </header>

      <Panel className="flex items-start gap-3 p-4">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent-brand" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Simulation mode — no Meta API connected</span>
          <p className="text-xs text-foreground/60">
            Live DMs require a Business/Creator account linked to a Facebook Page, Meta app
            review for messaging permissions, and respecting Meta&apos;s 24-hour messaging
            window. Until that approval exists, activating a flow only activates it inside
            this app, and every log entry below is marked simulated.
          </p>
        </div>
      </Panel>

      {editing && (
        <FlowBuilder
          existing={editing.flow}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {error ? (
        <PlaceholderEmptyState icon={Zap} title="Couldn't load flows" description={error} />
      ) : loading ? (
        <ListSkeleton count={3} />
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
              Flows
            </h2>
            {flows.length === 0 ? (
              <PlaceholderEmptyState
                icon={Zap}
                title="No flows yet"
                description="Create a keyword trigger — for example, comment GUIDE to receive a link."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {flows.map((flow) => (
                  <Panel key={flow.id} className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-sm font-semibold">
                            &ldquo;{flow.triggerKeyword}&rdquo;
                          </span>
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {flow.platform}
                          </Badge>
                        </div>
                        <span className="text-xs text-foreground/50">
                          {flow.steps.length} step{flow.steps.length === 1 ? "" : "s"}
                          {flow.requiresFollow ? " · follow-gated" : " · open to anyone"}
                        </span>
                      </div>
                      <Select
                        value={flow.status}
                        onValueChange={async (v) => {
                          await setFlowStatus(flow.id, v as AutomationStatus);
                          await refresh();
                        }}
                      >
                        <SelectTrigger size="sm" className="w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <ol className="flex flex-col gap-1.5">
                      {flow.steps.map((step, i) => (
                        <li key={i} className="flex gap-2 text-xs text-foreground/70">
                          <span className="text-foreground/35">{i + 1}.</span>
                          <span className="line-clamp-2">{step.message}</span>
                        </li>
                      ))}
                    </ol>

                    <div className="flex items-center gap-1.5 border-t border-subtle pt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5"
                        onClick={() => {
                          setSimContact("@test_user");
                          setSimFollows(true);
                          setSimulating(flow);
                        }}
                      >
                        <Play className="size-3.5" /> Simulate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5"
                        onClick={() => setEditing({ flow })}
                      >
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto gap-1.5 text-destructive"
                        onClick={async () => {
                          await deleteFlow(flow.id);
                          await refresh();
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </Panel>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60">
              Automation Log
            </h2>
            {log.length === 0 ? (
              <Panel className="p-4">
                <p className="text-sm text-foreground/55">
                  No automations have run yet. Use Simulate on a flow to see how it would
                  behave.
                </p>
              </Panel>
            ) : (
              <Panel className="overflow-hidden p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead className="text-right">When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {log.map((entry) => {
                      const flow = flows.find((f) => f.id === entry.flowId);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            {flow ? `"${flow.triggerKeyword}"` : "—"}
                          </TableCell>
                          <TableCell>{entry.contactIdentifier ?? "—"}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1.5">
                              {RESULT_LABEL[entry.result]}
                              {entry.simulated && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Simulated
                                </Badge>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs text-foreground/50">
                            {formatRelativeTime(entry.triggeredAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Panel>
            )}
          </section>
        </>
      )}

      <Dialog open={!!simulating} onOpenChange={(open) => !open && setSimulating(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Simulate trigger</DialogTitle>
            <DialogDescription>
              Runs the follow-gate logic for &ldquo;{simulating?.triggerKeyword}&rdquo; and
              records the outcome. No DM is sent.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sim-contact">Contact</Label>
              <Input
                id="sim-contact"
                value={simContact}
                onChange={(e) => setSimContact(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-subtle p-3">
              <Label className="text-sm">Contact follows the account</Label>
              <Switch checked={simFollows} onCheckedChange={setSimFollows} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSimulating(null)}>
              Cancel
            </Button>
            <Button onClick={handleSimulate}>Run simulation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
