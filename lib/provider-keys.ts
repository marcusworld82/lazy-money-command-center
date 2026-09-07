import "server-only";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const PROVIDER_IDS = ["openrouter", "fal", "openai", "anthropic"] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];

function envName(id: string) {
  if (id === "openai") return "OPENAI_API_KEY";
  if (id === "anthropic") return "ANTHROPIC_API_KEY";
  if (id === "fal") return "FAL_KEY";
  return "OPENROUTER_API_KEY";
}

function cookieName(id: string) {
  return `marco_key_${id}`;
}

export async function resolveProviderKey(id: string): Promise<string | null> {
  try {
    const jar = await cookies();
    const fromCookie = jar.get(cookieName(id))?.value?.trim();
    if (fromCookie) return fromCookie;
  } catch { /* cookies() unavailable in some workers */ }
  try {
    const { data } = await getSupabaseServerClient().from("settings").select("value").eq("key", `secret:${id}`).maybeSingle();
    const fromTable = (data?.value as { key?: string } | null)?.key?.trim();
    if (fromTable) return fromTable;
  } catch { /* table or role missing */ }
  return process.env[envName(id)]?.trim() || null;
}

export async function persistProviderKey(id: string, key: string) {
  const jar = await cookies();
  jar.set(cookieName(id), key, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  try {
    await getSupabaseServerClient().from("settings").upsert(
      { key: `secret:${id}`, value: { key, last4: key.slice(-4) }, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  } catch { /* cookie is enough for this browser session */ }
}

export async function providerLast4(id: string): Promise<string | null> {
  const key = await resolveProviderKey(id);
  return key ? key.slice(-4) : null;
}
