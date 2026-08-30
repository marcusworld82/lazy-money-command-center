"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AutomationFlow,
  AutomationLogEntry,
  AutomationPlatform,
  AutomationResult,
  AutomationStatus,
  AutomationStep,
} from "@/lib/types";

interface FlowRow {
  id: string;
  platform: string;
  trigger_keyword: string;
  requires_follow: boolean;
  steps: AutomationStep[];
  status: string;
  created_at: string;
}

function mapFlow(row: FlowRow): AutomationFlow {
  return {
    id: row.id,
    platform: row.platform as AutomationPlatform,
    triggerKeyword: row.trigger_keyword,
    requiresFollow: row.requires_follow,
    steps: row.steps ?? [],
    status: row.status as AutomationStatus,
    createdAt: row.created_at,
  };
}

interface LogRow {
  id: string;
  flow_id: string | null;
  contact_identifier: string | null;
  triggered_at: string;
  result: string;
  simulated: boolean;
}

function mapLog(row: LogRow): AutomationLogEntry {
  return {
    id: row.id,
    flowId: row.flow_id ?? undefined,
    contactIdentifier: row.contact_identifier ?? undefined,
    triggeredAt: row.triggered_at,
    result: row.result as AutomationResult,
    simulated: row.simulated,
  };
}

export async function listFlows(): Promise<AutomationFlow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("automation_flows")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as FlowRow[]).map(mapFlow);
}

export async function saveFlow(input: {
  id?: string;
  platform: AutomationPlatform;
  triggerKeyword: string;
  requiresFollow: boolean;
  steps: AutomationStep[];
}): Promise<AutomationFlow> {
  const supabase = getSupabaseServerClient();
  const payload = {
    platform: input.platform,
    trigger_keyword: input.triggerKeyword,
    requires_follow: input.requiresFollow,
    steps: input.steps,
  };

  const query = input.id
    ? supabase.from("automation_flows").update(payload).eq("id", input.id)
    : supabase.from("automation_flows").insert(payload);

  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return mapFlow(data as FlowRow);
}

export async function setFlowStatus(
  id: string,
  status: AutomationStatus,
): Promise<AutomationFlow> {
  const supabase = getSupabaseServerClient();

  // TODO: connect real Meta Graph API once app review is approved.
  // Activating a flow should also register/verify the webhook subscription for
  // the linked Page or IG Business account. Until those permissions are granted,
  // "active" only means active inside this app.
  const { data, error } = await supabase
    .from("automation_flows")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapFlow(data as FlowRow);
}

export async function deleteFlow(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("automation_flows").delete().eq("id", id);
  if (error) throw error;
}

export async function listAutomationLog(): Promise<AutomationLogEntry[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("automation_log")
    .select("*")
    .order("triggered_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as LogRow[]).map(mapLog);
}

/**
 * Simulates one inbound trigger end to end and records the outcome.
 *
 * No message is actually sent. The follow-gate branch is evaluated locally so
 * the gating logic is exercised and reviewable before any real permissions
 * exist, and every row it writes is flagged `simulated`.
 *
 * TODO: connect real Meta Graph API once app review is approved. The real path
 * would: verify the contact follows the account (IG Graph), then send the step
 * sequence via the Messenger Platform, respecting the 24-hour messaging window,
 * and write the result with simulated=false.
 */
export async function simulateTrigger(input: {
  flowId: string;
  contactIdentifier: string;
  contactFollows: boolean;
}): Promise<AutomationLogEntry> {
  const supabase = getSupabaseServerClient();

  const { data: flow, error: flowError } = await supabase
    .from("automation_flows")
    .select("*")
    .eq("id", input.flowId)
    .single();
  if (flowError) throw flowError;

  const typed = mapFlow(flow as FlowRow);

  let result: AutomationResult;
  if (typed.status !== "active") {
    result = "failed";
  } else if (typed.requiresFollow && !input.contactFollows) {
    result = "gated_not_following";
  } else if (typed.steps.length === 0) {
    result = "failed";
  } else {
    result = "sent";
  }

  const { data, error } = await supabase
    .from("automation_log")
    .insert({
      flow_id: typed.id,
      contact_identifier: input.contactIdentifier,
      result,
      simulated: true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapLog(data as LogRow);
}
