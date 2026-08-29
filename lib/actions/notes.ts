"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/actions/shared";
import type { Note } from "@/lib/types";
import type { Workspace } from "@/lib/workspace";

interface NoteRow {
  id: string;
  content: string;
  workspace_id: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: NoteRow): Note {
  return {
    id: row.id,
    content: row.content,
    workspace: (row.workspace_id as Workspace | null) ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listNotes(): Promise<Note[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as NoteRow[]).map(mapRow);
}

export async function createNote(input: {
  content: string;
  workspace?: Workspace;
}): Promise<Note> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notes")
    .insert({ content: input.content, workspace_id: input.workspace ?? null })
    .select("*")
    .single();
  if (error) throw error;

  const note = mapRow(data as NoteRow);
  await logActivity(supabase, {
    type: "note",
    action: "created",
    refId: note.id,
    label: "Note added",
    detail: note.content.slice(0, 60),
    workspaceId: note.workspace,
  });
  return note;
}

export async function updateNote(id: string, content: string): Promise<Note> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notes")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  const note = mapRow(data as NoteRow);
  await logActivity(supabase, {
    type: "note",
    action: "updated",
    refId: note.id,
    label: "Note updated",
    detail: note.content.slice(0, 60),
    workspaceId: note.workspace,
  });
  return note;
}

export async function deleteNote(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: existing } = await supabase
    .from("notes")
    .select("content, workspace_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;

  if (existing) {
    await logActivity(supabase, {
      type: "note",
      action: "deleted",
      refId: id,
      label: "Note deleted",
      detail: (existing.content as string).slice(0, 60),
      workspaceId: (existing.workspace_id as Workspace | null) ?? undefined,
    });
  }
}
