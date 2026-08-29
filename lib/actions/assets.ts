"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/actions/shared";
import type { Asset, AssetType } from "@/lib/types";
import type { Workspace } from "@/lib/workspace";

const BUCKET = "assets";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

interface AssetRow {
  id: string;
  filename: string;
  type: string;
  workspace_id: string | null;
  storage_path: string;
  created_at: string;
}

function inferAssetType(mimeType: string): AssetType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

async function mapRowWithSignedUrl(supabase: SupabaseClient, row: AssetRow): Promise<Asset> {
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);
  return {
    id: row.id,
    filename: row.filename,
    type: row.type as AssetType,
    workspace: (row.workspace_id as Workspace | null) ?? undefined,
    url: data?.signedUrl ?? "",
    createdAt: row.created_at,
  };
}

export async function listAssets(): Promise<Asset[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return Promise.all((data as AssetRow[]).map((row) => mapRowWithSignedUrl(supabase, row)));
}

export async function addAsset(formData: FormData): Promise<Asset> {
  const supabase = getSupabaseServerClient();
  const file = formData.get("file") as File | null;
  const workspace = (formData.get("workspace") as string | null) || undefined;
  if (!file) throw new Error("No file provided");

  const type = inferAssetType(file.type);
  const path = `${workspace ?? "unassigned"}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("assets")
    .insert({ filename: file.name, type, workspace_id: workspace ?? null, storage_path: path })
    .select("*")
    .single();
  if (error) throw error;

  const asset = await mapRowWithSignedUrl(supabase, data as AssetRow);
  await logActivity(supabase, {
    type: "asset",
    action: "created",
    refId: asset.id,
    label: "Asset added",
    detail: asset.filename,
    workspaceId: asset.workspace,
  });
  return asset;
}

export async function removeAsset(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: existing } = await supabase
    .from("assets")
    .select("filename, storage_path, workspace_id")
    .eq("id", id)
    .single();
  if (!existing) return;

  await supabase.storage.from(BUCKET).remove([existing.storage_path as string]);
  const { error } = await supabase.from("assets").delete().eq("id", id);
  if (error) throw error;

  await logActivity(supabase, {
    type: "asset",
    action: "deleted",
    refId: id,
    label: "Asset removed",
    detail: existing.filename as string,
    workspaceId: (existing.workspace_id as Workspace | null) ?? undefined,
  });
}
