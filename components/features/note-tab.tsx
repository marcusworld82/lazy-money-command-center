"use client";

import * as React from "react";
import { Panel } from "@/components/ui/panel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { CardGridSkeleton } from "@/components/ui/skeleton";
import { Plus, StickyNote, Trash2, Search } from "lucide-react";
import { useAppData } from "@/lib/providers/app-data-provider";
import { formatRelativeTime } from "@/lib/utils";

export function NoteTab() {
  const { notes, createNote, updateNote, deleteNote, loading, error } = useAppData();
  const [draft, setDraft] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    createNote({ content: draft.trim() });
    setDraft("");
  }

  function startEdit(id: string, content: string) {
    setEditingId(id);
    setEditValue(content);
  }

  function commitEdit() {
    if (editingId && editValue.trim()) {
      updateNote(editingId, editValue.trim());
    }
    setEditingId(null);
  }

  const filtered = notes
    .filter((n) => n.content.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="flex items-start gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Jot a note or idea…"
          rows={2}
          className="flex-1"
        />
        <Button type="submit" variant="secondary" className="gap-1.5 shrink-0">
          <Plus className="size-4" /> Add Note
        </Button>
      </form>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/40" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes…"
          className="pl-9"
        />
      </div>

      {error ? (
        <PlaceholderEmptyState icon={StickyNote} title="Couldn't load notes" description={error} />
      ) : loading ? (
        <CardGridSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <PlaceholderEmptyState
          icon={StickyNote}
          title={notes.length === 0 ? "No notes yet" : "No matching notes"}
          description="Free-form ideas and notes captured across every business."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((note) => (
            <Panel key={note.id} className="flex flex-col gap-2 p-4">
              {editingId === note.id ? (
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  autoFocus
                  rows={3}
                />
              ) : (
                <p
                  className="cursor-text text-sm whitespace-pre-wrap text-foreground/80"
                  onClick={() => startEdit(note.id, note.content)}
                >
                  {note.content}
                </p>
              )}
              <div className="mt-auto flex items-center justify-between pt-1">
                <span className="text-xs text-foreground/40">
                  {formatRelativeTime(note.updatedAt)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteNote(note.id)}
                  aria-label="Delete note"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
