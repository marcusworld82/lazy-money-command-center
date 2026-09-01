"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CONNECTORS } from "@/lib/content/platforms";
import { getPublishMode } from "@/lib/actions/settings";
import type {
  ContentItem,
  ContentVersion,
  ContentAnalysis,
  ContentPlatform,
  ContentType,
  ContentGoal,
  ContentVersionPayload,
  VersionStatus,
  BrandVoiceProfile,
  BrandVoiceProfileData,
  ScheduledPost,
} from "@/lib/types";
import type { Workspace } from "@/lib/workspace";

/* ------------------------------------------------------------------ */
/* Content items                                                       */
/* ------------------------------------------------------------------ */

interface ItemRow {
  id: string;
  workspace_id: string | null;
  title: string | null;
  original_content: string | null;
  content_type: string | null;
  goal: string | null;
  audience: string | null;
  cta: string | null;
  analysis: ContentAnalysis | null;
  status: string;
  created_at: string;
}

function mapItem(row: ItemRow): ContentItem {
  return {
    id: row.id,
    workspace: (row.workspace_id as Workspace | null) ?? undefined,
    title: row.title ?? "Untitled",
    originalContent: row.original_content ?? "",
    contentType: (row.content_type as ContentType | null) ?? "text",
    goal: (row.goal as ContentGoal | null) ?? undefined,
    audience: row.audience ?? undefined,
    cta: row.cta ?? undefined,
    analysis: row.analysis ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listContentItems(): Promise<ContentItem[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ItemRow[]).map(mapItem);
}

export async function createContentItem(input: {
  workspace?: Workspace;
  title: string;
  originalContent: string;
  contentType: ContentType;
  goal?: ContentGoal;
  audience?: string;
  cta?: string;
}): Promise<ContentItem> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("content_items")
    .insert({
      workspace_id: input.workspace ?? null,
      title: input.title,
      original_content: input.originalContent,
      content_type: input.contentType,
      goal: input.goal ?? null,
      audience: input.audience ?? null,
      cta: input.cta ?? null,
      status: "draft",
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapItem(data as ItemRow);
}

export async function deleteContentItem(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("content_items").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/* Versions                                                            */
/* ------------------------------------------------------------------ */

interface VersionRow {
  id: string;
  content_id: string;
  platform: string;
  payload: ContentVersionPayload;
  status: string;
  approved_at: string | null;
  created_at: string;
}

function mapVersion(row: VersionRow): ContentVersion {
  return {
    id: row.id,
    contentId: row.content_id,
    platform: row.platform as ContentPlatform,
    payload: row.payload ?? {},
    status: row.status as VersionStatus,
    approvedAt: row.approved_at ?? undefined,
    createdAt: row.created_at,
  };
}

export async function listVersions(): Promise<ContentVersion[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("content_versions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as VersionRow[]).map(mapVersion);
}

/* ------------------------------------------------------------------ */
/* The pipeline: analyze -> adapt                                      */
/* ------------------------------------------------------------------ */

/** Step 1. Extracts the single source of truth before any rewriting happens. */
export async function runAnalyzer(itemId: string): Promise<ContentItem> {
  throw new Error("Content analysis is not available in Phase 4.6. Create a Run in the Social thread instead.");
  /*
  const supabase = getSupabaseServerClient();
  const { data: row, error: readError } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", itemId)
    .single();
  if (readError) throw readError;

  const item = mapItem(row as ItemRow);
  const analysis = await analyzeContent(item);

  const { data, error } = await supabase
    .from("content_items")
    .update({ analysis, status: "analyzed" })
    .eq("id", itemId)
    .select("*")
    .single();
  if (error) throw error;
  return mapItem(data as ItemRow); */
}

/**
 * Step 2. One adapter run per platform, each producing its own version row.
 *
 * Every version is checked for dropped facts before it is stored; anything
 * missing is surfaced in the payload notes rather than passing silently.
 */
export async function runAdapters(
  itemId: string,
  platforms: ContentPlatform[],
  brandVoiceId?: string,
): Promise<ContentVersion[]> {
  throw new Error("Content adaptation is not available in Phase 4.6. Create a Run in the Social thread instead.");
  /*
  const supabase = getSupabaseServerClient();

  const { data: row, error: readError } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", itemId)
    .single();
  if (readError) throw readError;

  const item = mapItem(row as ItemRow);
  if (!item.analysis) {
    throw new Error("Run the Content Analyzer before generating platform versions.");
  }

  let brandVoice: BrandVoiceProfileData | undefined;
  if (brandVoiceId) {
    const { data: voice } = await supabase
      .from("brand_voice_profiles")
      .select("profile")
      .eq("id", brandVoiceId)
      .maybeSingle();
    brandVoice = (voice?.profile as BrandVoiceProfileData) ?? undefined;
  }

  const created: ContentVersion[] = [];

  for (const platform of platforms) {
    // Each platform is isolated: one bad model response (malformed JSON, a
    // provider hiccup) must not discard the adaptations that already succeeded.
    // Failures are recorded as a `failed` version so they're visible and
    // individually regenerable, rather than vanishing.
    let finalPayload: ContentVersionPayload;
    let status: VersionStatus = "ready_for_review";

    try {
      const payload = await adaptForPlatform({
        platform,
        analysis: item.analysis,
        brandVoice,
        goal: item.goal,
        audience: item.audience,
        cta: item.cta,
      });

      const missing = findMissingFacts(item.analysis, payload);
      finalPayload = missing.length
        ? {
            ...payload,
            notes: [
              payload.notes,
              `REVIEW NEEDED — these facts may not have carried through verbatim: ${missing.join(" | ")}`,
            ]
              .filter(Boolean)
              .join("\n\n"),
          }
        : payload;
    } catch (e) {
      status = "failed";
      finalPayload = {
        notes: `Adaptation failed: ${
          e instanceof Error ? e.message : "unknown error"
        }\n\nRegenerate this platform to try again.`,
      };
    }

    // Regenerating replaces the existing version for this platform rather than
    // adding a duplicate (unique on content_id + platform).
    const { data, error } = await supabase
      .from("content_versions")
      .upsert(
        {
          content_id: itemId,
          platform,
          payload: finalPayload,
          status,
          approved_at: null,
        },
        { onConflict: "content_id,platform" },
      )
      .select("*")
      .single();
    if (error) throw error;
    created.push(mapVersion(data as VersionRow));
  }

  await supabase.from("content_items").update({ status: "adapted" }).eq("id", itemId);
  return created; */
}

/* ------------------------------------------------------------------ */
/* Approval + publishing                                               */
/* ------------------------------------------------------------------ */

export async function setVersionStatus(
  id: string,
  status: VersionStatus,
): Promise<ContentVersion> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("content_versions")
    .update({
      status,
      approved_at: status === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapVersion(data as VersionRow);
}

export async function scheduleVersion(
  versionId: string,
  scheduledFor: string,
): Promise<ScheduledPost> {
  const supabase = getSupabaseServerClient();

  // Master spec section 5 requires an idempotency key so a retry can't double-post.
  const idempotencyKey = `${versionId}:${scheduledFor}`;

  const { data, error } = await supabase
    .from("scheduled_posts")
    .upsert(
      {
        version_id: versionId,
        scheduled_for: scheduledFor,
        status: "scheduled",
        idempotency_key: idempotencyKey,
      },
      { onConflict: "idempotency_key" },
    )
    .select("*")
    .single();
  if (error) throw error;

  await supabase
    .from("content_versions")
    .update({ status: "scheduled" })
    .eq("id", versionId);

  const row = data as {
    id: string;
    version_id: string;
    scheduled_for: string | null;
    status: string;
    idempotency_key: string | null;
    attempts: number;
  };
  return {
    id: row.id,
    versionId: row.version_id,
    scheduledFor: row.scheduled_for ?? undefined,
    status: row.status,
    idempotencyKey: row.idempotency_key ?? undefined,
    attempts: row.attempts,
  };
}

export async function listScheduledPosts(): Promise<ScheduledPost[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("scheduled_posts").select("*");
  if (error) throw error;
  return (
    data as {
      id: string;
      version_id: string;
      scheduled_for: string | null;
      status: string;
      idempotency_key: string | null;
      attempts: number;
    }[]
  ).map((row) => ({
    id: row.id,
    versionId: row.version_id,
    scheduledFor: row.scheduled_for ?? undefined,
    status: row.status,
    idempotencyKey: row.idempotency_key ?? undefined,
    attempts: row.attempts,
  }));
}

/**
 * Attempts a real publish through the platform's connector.
 *
 * No connector has a working publish path this phase, so this always lands on
 * READY_TO_POST. The status is written from the connector's actual result, not
 * assumed — which is what makes "never claim published without a successful
 * publish call" hold structurally.
 */
export async function attemptPublish(versionId: string): Promise<ContentVersion> {
  const supabase = getSupabaseServerClient();
  const { data: row, error: readError } = await supabase
    .from("content_versions")
    .select("*")
    .eq("id", versionId)
    .single();
  if (readError) throw readError;

  const version = mapVersion(row as VersionRow);
  const mode = await getPublishMode();

  if (mode.humanApprovalRequired && version.status !== "approved") {
    throw new Error(
      "Manual approval is required. Approve this version before publishing.",
    );
  }

  const connector = CONNECTORS[version.platform];
  const result = await connector.publish(version);

  if (!result.ok) {
    const { data, error } = await supabase
      .from("content_versions")
      .update({ status: "ready_to_post" })
      .eq("id", versionId)
      .select("*")
      .single();
    if (error) throw error;
    return mapVersion(data as VersionRow);
  }

  // Only reachable once a connector genuinely publishes.
  await supabase.from("published_posts").insert({
    version_id: versionId,
    platform_post_id: result.platformPostId ?? null,
    url: result.url ?? null,
  });
  const { data, error } = await supabase
    .from("content_versions")
    .update({ status: "published" })
    .eq("id", versionId)
    .select("*")
    .single();
  if (error) throw error;
  return mapVersion(data as VersionRow);
}

/* ------------------------------------------------------------------ */
/* Brand voice profiles                                                */
/* ------------------------------------------------------------------ */

export async function listBrandVoices(): Promise<BrandVoiceProfile[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("brand_voice_profiles").select("*");
  if (error) throw error;
  return (
    data as {
      id: string;
      workspace_id: string | null;
      name: string;
      profile: BrandVoiceProfileData;
      created_at: string;
    }[]
  ).map((row) => ({
    id: row.id,
    workspace: (row.workspace_id as Workspace | null) ?? undefined,
    name: row.name,
    profile: row.profile ?? {},
    createdAt: row.created_at,
  }));
}

export async function saveBrandVoice(input: {
  id?: string;
  workspace?: Workspace;
  name: string;
  profile: BrandVoiceProfileData;
}): Promise<BrandVoiceProfile> {
  const supabase = getSupabaseServerClient();
  const payload = {
    workspace_id: input.workspace ?? null,
    name: input.name,
    profile: input.profile,
  };
  const query = input.id
    ? supabase.from("brand_voice_profiles").update(payload).eq("id", input.id)
    : supabase.from("brand_voice_profiles").insert(payload);

  const { data, error } = await query.select("*").single();
  if (error) throw error;
  const row = data as {
    id: string;
    workspace_id: string | null;
    name: string;
    profile: BrandVoiceProfileData;
    created_at: string;
  };
  return {
    id: row.id,
    workspace: (row.workspace_id as Workspace | null) ?? undefined,
    name: row.name,
    profile: row.profile ?? {},
    createdAt: row.created_at,
  };
}

/* ------------------------------------------------------------------ */
/* Analytics                                                           */
/* ------------------------------------------------------------------ */

/**
 * Master spec section 5: never fabricate metrics. With no publish connectors
 * wired, every platform genuinely has no data, so this returns nulls rather
 * than zeros that would read as real measurements.
 */
export async function getAnalyticsSummary(): Promise<
  { platform: ContentPlatform; metrics: Record<string, number> | null }[]
> {
  const versions = await listVersions();
  return Promise.all(
    versions.map(async (v) => ({
      platform: v.platform,
      metrics: await CONNECTORS[v.platform].getAnalytics(v),
    })),
  );
}
