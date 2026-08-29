import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityType, ActivityAction } from "@/lib/types";
import type { Workspace } from "@/lib/workspace";

export async function logActivity(
  supabase: SupabaseClient,
  entry: {
    type: ActivityType;
    action: ActivityAction;
    refId: string;
    label: string;
    detail?: string;
    workspaceId?: Workspace;
  },
) {
  await supabase.from("activity_log").insert({
    type: entry.type,
    action: entry.action,
    ref_id: entry.refId,
    label: entry.label,
    detail: entry.detail ?? null,
    workspace_id: entry.workspaceId ?? null,
  });
}
