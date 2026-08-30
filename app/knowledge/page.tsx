"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { PlaceholderEmptyState } from "@/components/ui/placeholder-empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BookOpen, FilePlus, FolderPlus, Save, Trash2, Copy, Sparkles } from "lucide-react";
import { KnowledgeTree } from "@/components/features/knowledge-tree";
import { MarkdownEditor } from "@/components/features/markdown-editor";
import { BrandKitForm } from "@/components/features/brand-kit-form";
import {
  listFolders,
  listDocuments,
  listBrandKits,
  createFolder,
  deleteFolder,
  createDocument,
  updateDocument,
  deleteDocument,
  duplicateDocument,
} from "@/lib/actions/knowledge";
import type {
  KnowledgeFolder,
  KnowledgeDocument,
  ClientBrandKit,
  DocumentType,
} from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "general", label: "General" },
  { value: "brand-bible", label: "Brand Bible" },
  { value: "sop", label: "SOP" },
  { value: "brand-kit", label: "Brand Kit" },
  { value: "design-dna", label: "Design DNA" },
];

export default function KnowledgeLibraryPage() {
  const [folders, setFolders] = React.useState<KnowledgeFolder[]>([]);
  const [documents, setDocuments] = React.useState<KnowledgeDocument[]>([]);
  const [brandKits, setBrandKits] = React.useState<ClientBrandKit[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = React.useState<string | null>(null);
  const [draftTitle, setDraftTitle] = React.useState("");
  const [draftContent, setDraftContent] = React.useState("");
  const [draftType, setDraftType] = React.useState<DocumentType>("general");
  const [saving, setSaving] = React.useState(false);

  // Real dialogs rather than window.prompt/confirm — those are blocked in some
  // embedded browsers and would break out of the design system regardless.
  const [folderDialog, setFolderDialog] = React.useState<{
    parentId: string | null;
  } | null>(null);
  const [folderNameDraft, setFolderNameDraft] = React.useState("");
  const [confirmDeleteFolder, setConfirmDeleteFolder] =
    React.useState<KnowledgeFolder | null>(null);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? null;
  const selectedDocument = documents.find((d) => d.id === selectedDocumentId) ?? null;
  const templateFolder = folders.find((f) => f.category === "template" && !f.parentId);

  const dirty =
    !!selectedDocument &&
    (draftTitle !== selectedDocument.title ||
      draftContent !== selectedDocument.content ||
      draftType !== selectedDocument.documentType);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [f, d, k] = await Promise.all([
        listFolders(),
        listDocuments(),
        listBrandKits(),
      ]);
      setFolders(f);
      setDocuments(d);
      setBrandKits(k);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load the knowledge library.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Deliberate: initial fetch-on-mount; Server Actions can't run during SSR render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  function openDocument(id: string) {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;
    setSelectedDocumentId(id);
    setSelectedFolderId(doc.folderId ?? null);
    setDraftTitle(doc.title);
    setDraftContent(doc.content);
    setDraftType(doc.documentType);
  }

  function openFolderDialog(parentId: string | null) {
    setFolderNameDraft("");
    setFolderDialog({ parentId });
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!folderDialog || !folderNameDraft.trim()) return;
    const parent = folderDialog.parentId
      ? folders.find((f) => f.id === folderDialog.parentId)
      : undefined;
    await createFolder({
      name: folderNameDraft.trim(),
      parentId: folderDialog.parentId ?? undefined,
      // Children inherit their parent's category/workspace so a new client
      // folder still renders its Brand Kit form, etc.
      category: parent?.category,
      workspace: parent?.workspace,
    });
    setFolderDialog(null);
    await refresh();
  }

  async function handleNewDocument() {
    if (!selectedFolderId) return;
    const doc = await createDocument({
      folderId: selectedFolderId,
      title: "Untitled document",
      content: "",
      documentType: "general",
    });
    await refresh();
    setSelectedDocumentId(doc.id);
    setDraftTitle(doc.title);
    setDraftContent(doc.content);
    setDraftType(doc.documentType);
  }

  async function handleSaveDocument() {
    if (!selectedDocument) return;
    setSaving(true);
    try {
      await updateDocument(selectedDocument.id, {
        title: draftTitle.trim() || "Untitled document",
        content: draftContent,
        documentType: draftType,
      });
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDocument() {
    if (!selectedDocument) return;
    await deleteDocument(selectedDocument.id);
    setSelectedDocumentId(null);
    await refresh();
  }

  async function handleDuplicateToFolder(targetId: string) {
    if (!selectedDocument) return;
    const copy = await duplicateDocument(selectedDocument.id, targetId);
    await refresh();
    setSelectedDocumentId(copy.id);
    setSelectedFolderId(targetId);
    setDraftTitle(copy.title);
    setDraftContent(copy.content);
    setDraftType(copy.documentType);
  }

  const folderKit = brandKits.find((k) => k.folderId === selectedFolderId);
  const isClientFolder = selectedFolder?.category === "client-business";
  const isDesignSystem = selectedFolder?.category === "design-system";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit text-[11px] uppercase tracking-wider">
          Build
        </Badge>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Knowledge Library
        </h1>
        <p className="max-w-xl text-sm text-foreground/60">
          Durable business facts, SOPs, and brand rules — the reusable context behind every
          project, asset, and workflow.
        </p>
      </header>

      {error ? (
        <PlaceholderEmptyState
          icon={BookOpen}
          title="Couldn't load the library"
          description={error}
        />
      ) : loading ? (
        <ListSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          <Panel className="flex h-fit flex-col gap-2 p-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/45">
                Folders
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="New top-level folder"
                onClick={() => openFolderDialog(null)}
              >
                <FolderPlus className="size-3.5" />
              </Button>
            </div>
            <KnowledgeTree
              folders={folders}
              documents={documents}
              selectedFolderId={selectedFolderId}
              selectedDocumentId={selectedDocumentId}
              onSelectFolder={(id) => {
                setSelectedFolderId(id);
                setSelectedDocumentId(null);
              }}
              onSelectDocument={openDocument}
              onAddSubfolder={openFolderDialog}
            />
          </Panel>

          <div className="flex flex-col gap-4">
            {selectedDocument ? (
              <Panel className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Input
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    className="h-9 max-w-sm font-heading text-base"
                  />
                  <div className="flex items-center gap-2">
                    {dirty && (
                      <span className="flex items-center gap-1.5 text-[11px] text-foreground/50">
                        <span className="size-1.5 rounded-full bg-accent-brand" />
                        Unsaved
                      </span>
                    )}
                    <Select
                      value={draftType}
                      onValueChange={(v) => setDraftType(v as DocumentType)}
                    >
                      <SelectTrigger size="sm" className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={handleSaveDocument}
                      disabled={saving}
                    >
                      <Save className="size-3.5" /> {saving ? "Saving…" : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-destructive"
                      onClick={handleDeleteDocument}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <span className="text-[11px] text-foreground/40">
                  Updated {formatRelativeTime(selectedDocument.updatedAt)}
                </span>

                <MarkdownEditor value={draftContent} onChange={setDraftContent} />

                {selectedFolder?.category === "template" && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-subtle pt-3">
                    <span className="text-xs text-foreground/55">
                      Duplicate this template into:
                    </span>
                    <Select onValueChange={handleDuplicateToFolder}>
                      <SelectTrigger size="sm" className="w-[200px]">
                        <SelectValue placeholder="Choose a folder…" />
                      </SelectTrigger>
                      <SelectContent>
                        {folders
                          .filter((f) => f.category !== "template")
                          .map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Copy className="size-3.5 text-foreground/40" />
                  </div>
                )}
              </Panel>
            ) : selectedFolder ? (
              <>
                <Panel className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex flex-col">
                    <h2 className="font-heading text-base font-semibold">
                      {selectedFolder.name}
                    </h2>
                    <span className="text-xs text-foreground/50">
                      {documents.filter((d) => d.folderId === selectedFolder.id).length}{" "}
                      document(s)
                      {selectedFolder.category ? ` · ${selectedFolder.category}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="gap-1.5" onClick={handleNewDocument}>
                      <FilePlus className="size-3.5" /> New Document
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-destructive"
                      onClick={() => setConfirmDeleteFolder(selectedFolder)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </Panel>

                {isDesignSystem && (
                  <Panel className="flex items-center gap-3 p-4">
                    <Sparkles className="size-4 shrink-0 text-accent-brand" />
                    <p className="text-xs text-foreground/60">
                      Folder structure is reserved now. Automated Design DNA codification
                      (dna.json, PROMPT.md, reconstruction tests) arrives in Phase 6 —
                      documents here work like anywhere else in the meantime.
                    </p>
                  </Panel>
                )}

                {isClientFolder && selectedFolder.parentId && (
                  <BrandKitForm
                    folderId={selectedFolder.id}
                    existing={folderKit}
                    onSaved={() => refresh()}
                  />
                )}

                {isClientFolder && !selectedFolder.parentId && (
                  <PlaceholderEmptyState
                    icon={FolderPlus}
                    title="Add a client folder"
                    description="Create a folder per client here — each one gets its own Brand Kit form and documents."
                  />
                )}
              </>
            ) : (
              <PlaceholderEmptyState
                icon={BookOpen}
                title="Pick a folder"
                description="Select a folder on the left to add documents, or open an existing one."
              />
            )}
          </div>
        </div>
      )}

      {templateFolder && !loading && !error && (
        <p className="text-xs text-foreground/40">
          Tip: documents inside Templates can be duplicated into any other folder.
        </p>
      )}

      <Dialog
        open={!!folderDialog}
        onOpenChange={(open) => !open && setFolderDialog(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handleCreateFolder} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>New folder</DialogTitle>
              <DialogDescription>
                {folderDialog?.parentId
                  ? `Inside "${folders.find((f) => f.id === folderDialog.parentId)?.name}"`
                  : "At the top level of the library"}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="folder-name">Name</Label>
              <Input
                id="folder-name"
                value={folderNameDraft}
                onChange={(e) => setFolderNameDraft(e.target.value)}
                placeholder="e.g. Acme HVAC"
                autoFocus
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setFolderDialog(null)}>
                Cancel
              </Button>
              <Button type="submit">Create folder</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDeleteFolder}
        onOpenChange={(open) => !open && setConfirmDeleteFolder(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete folder</DialogTitle>
            <DialogDescription>
              Delete &quot;{confirmDeleteFolder?.name}&quot; along with every subfolder,
              document, and brand kit inside it. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDeleteFolder(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!confirmDeleteFolder) return;
                await deleteFolder(confirmDeleteFolder.id);
                setConfirmDeleteFolder(null);
                setSelectedFolderId(null);
                setSelectedDocumentId(null);
                await refresh();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
