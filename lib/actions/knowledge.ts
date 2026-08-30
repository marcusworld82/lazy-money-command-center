"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  KnowledgeFolder,
  KnowledgeDocument,
  KnowledgeCategory,
  DocumentType,
  ClientBrandKit,
  BrandKitColors,
} from "@/lib/types";
import type { Workspace } from "@/lib/workspace";

/* ------------------------------------------------------------------ */
/* Folders                                                             */
/* ------------------------------------------------------------------ */

interface FolderRow {
  id: string;
  name: string;
  parent_id: string | null;
  workspace_id: string | null;
  category: string | null;
  created_at: string;
}

function mapFolder(row: FolderRow): KnowledgeFolder {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id ?? undefined,
    workspace: (row.workspace_id as Workspace | null) ?? undefined,
    category: (row.category as KnowledgeCategory | null) ?? undefined,
    createdAt: row.created_at,
  };
}

export async function listFolders(): Promise<KnowledgeFolder[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("knowledge_folders")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data as FolderRow[]).map(mapFolder);
}

export async function createFolder(input: {
  name: string;
  parentId?: string;
  workspace?: Workspace;
  category?: KnowledgeCategory;
}): Promise<KnowledgeFolder> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("knowledge_folders")
    .insert({
      name: input.name,
      parent_id: input.parentId ?? null,
      workspace_id: input.workspace ?? null,
      category: input.category ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapFolder(data as FolderRow);
}

export async function renameFolder(id: string, name: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("knowledge_folders")
    .update({ name })
    .eq("id", id);
  if (error) throw error;
}

/** Cascades to child folders, documents, and brand kits via FK on delete cascade. */
export async function deleteFolder(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("knowledge_folders").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

interface DocumentRow {
  id: string;
  folder_id: string | null;
  title: string;
  content: string | null;
  document_type: string | null;
  created_at: string;
  updated_at: string;
}

function mapDocument(row: DocumentRow): KnowledgeDocument {
  return {
    id: row.id,
    folderId: row.folder_id ?? undefined,
    title: row.title,
    content: row.content ?? "",
    documentType: (row.document_type as DocumentType | null) ?? "general",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listDocuments(): Promise<KnowledgeDocument[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as DocumentRow[]).map(mapDocument);
}

export async function createDocument(input: {
  folderId?: string;
  title: string;
  content?: string;
  documentType?: DocumentType;
}): Promise<KnowledgeDocument> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("knowledge_documents")
    .insert({
      folder_id: input.folderId ?? null,
      title: input.title,
      content: input.content ?? "",
      document_type: input.documentType ?? "general",
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapDocument(data as DocumentRow);
}

export async function updateDocument(
  id: string,
  patch: { title?: string; content?: string; documentType?: DocumentType },
): Promise<KnowledgeDocument> {
  const supabase = getSupabaseServerClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.content !== undefined) payload.content = patch.content;
  if (patch.documentType !== undefined) payload.document_type = patch.documentType;

  const { data, error } = await supabase
    .from("knowledge_documents")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapDocument(data as DocumentRow);
}

export async function deleteDocument(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("knowledge_documents").delete().eq("id", id);
  if (error) throw error;
}

/** Copies a template document into another folder, leaving the original alone. */
export async function duplicateDocument(
  id: string,
  targetFolderId: string,
): Promise<KnowledgeDocument> {
  const supabase = getSupabaseServerClient();
  const { data: source, error: readError } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("id", id)
    .single();
  if (readError) throw readError;

  const src = source as DocumentRow;
  return createDocument({
    folderId: targetFolderId,
    title: `${src.title} (copy)`,
    content: src.content ?? "",
    documentType: (src.document_type as DocumentType | null) ?? "general",
  });
}

/* ------------------------------------------------------------------ */
/* Client brand kits                                                   */
/* ------------------------------------------------------------------ */

interface BrandKitRow {
  id: string;
  folder_id: string | null;
  business_name: string;
  industry: string | null;
  website: string | null;
  primary_contact: string | null;
  colors: BrandKitColors | null;
  typography: string | null;
  brand_voice: string | null;
  audience: string | null;
  offers: string | null;
  restrictions: string | null;
  created_at: string;
  updated_at: string;
}

function mapBrandKit(row: BrandKitRow): ClientBrandKit {
  return {
    id: row.id,
    folderId: row.folder_id ?? undefined,
    businessName: row.business_name,
    industry: row.industry ?? undefined,
    website: row.website ?? undefined,
    primaryContact: row.primary_contact ?? undefined,
    colors: row.colors ?? undefined,
    typography: row.typography ?? undefined,
    brandVoice: row.brand_voice ?? undefined,
    audience: row.audience ?? undefined,
    offers: row.offers ?? undefined,
    restrictions: row.restrictions ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listBrandKits(): Promise<ClientBrandKit[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("client_brand_kits").select("*");
  if (error) throw error;
  return (data as BrandKitRow[]).map(mapBrandKit);
}

export async function saveBrandKit(input: {
  id?: string;
  folderId: string;
  businessName: string;
  industry?: string;
  website?: string;
  primaryContact?: string;
  colors?: BrandKitColors;
  typography?: string;
  brandVoice?: string;
  audience?: string;
  offers?: string;
  restrictions?: string;
}): Promise<ClientBrandKit> {
  const supabase = getSupabaseServerClient();
  const payload = {
    folder_id: input.folderId,
    business_name: input.businessName,
    industry: input.industry ?? null,
    website: input.website ?? null,
    primary_contact: input.primaryContact ?? null,
    colors: input.colors ?? null,
    typography: input.typography ?? null,
    brand_voice: input.brandVoice ?? null,
    audience: input.audience ?? null,
    offers: input.offers ?? null,
    restrictions: input.restrictions ?? null,
    updated_at: new Date().toISOString(),
  };

  const query = input.id
    ? supabase.from("client_brand_kits").update(payload).eq("id", input.id)
    : supabase.from("client_brand_kits").insert(payload);

  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return mapBrandKit(data as BrandKitRow);
}
