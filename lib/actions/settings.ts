"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PublishMode } from "@/lib/types";

const PUBLISH_MODE_KEY = "publish_mode";

/** Master spec section 5: manual approval is the default, auto-publish off. */
const SAFE_DEFAULT: PublishMode = { autoPublish: false, humanApprovalRequired: true };

export async function getPublishMode(): Promise<PublishMode> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", PUBLISH_MODE_KEY)
    .maybeSingle();
  if (error) throw error;
  // Fall back to the safe default rather than inventing a permissive one.
  return (data?.value as PublishMode | undefined) ?? SAFE_DEFAULT;
}

export async function setPublishMode(mode: PublishMode): Promise<PublishMode> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .upsert(
      { key: PUBLISH_MODE_KEY, value: mode, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    )
    .select("value")
    .single();
  if (error) throw error;
  return data.value as PublishMode;
}

/** Lets the UI explain a missing key without ever exposing its value. */
export async function getLLMKeyStatus(): Promise<{ configured: boolean }> {
  return { configured: Boolean(process.env.OPENROUTER_API_KEY) };
}
