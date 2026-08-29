"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ActivityItem, ActivityType, ActivityAction } from "@/lib/types";

interface ActivityRow {
  id: string;
  type: string;
  action: string;
  ref_id: string | null;
  label: string;
  detail: string | null;
  workspace_id: string | null;
  timestamp: string;
}

function mapRow(row: ActivityRow): ActivityItem {
  return {
    id: row.id,
    type: row.type as ActivityType,
    action: row.action as ActivityAction,
    refId: row.ref_id ?? "",
    label: row.label,
    detail: row.detail ?? undefined,
    timestamp: row.timestamp,
  };
}

export async function listActivity(): Promise<ActivityItem[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as ActivityRow[]).map(mapRow);
}
