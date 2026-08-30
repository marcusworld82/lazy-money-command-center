"use client";

import * as React from "react";
import { ChevronRight, Folder, FolderOpen, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { KnowledgeFolder, KnowledgeDocument } from "@/lib/types";
import { cn } from "@/lib/utils";

interface KnowledgeTreeProps {
  folders: KnowledgeFolder[];
  documents: KnowledgeDocument[];
  selectedFolderId: string | null;
  selectedDocumentId: string | null;
  onSelectFolder: (id: string) => void;
  onSelectDocument: (id: string) => void;
  onAddSubfolder: (parentId: string) => void;
}

function FolderNode({
  folder,
  depth,
  ...props
}: KnowledgeTreeProps & { folder: KnowledgeFolder; depth: number }) {
  const {
    folders,
    documents,
    selectedFolderId,
    selectedDocumentId,
    onSelectFolder,
    onSelectDocument,
    onAddSubfolder,
  } = props;

  const children = folders.filter((f) => f.parentId === folder.id);
  const docs = documents.filter((d) => d.folderId === folder.id);
  const hasChildren = children.length > 0 || docs.length > 0;
  // Root folders start open so the library reads as a map, not a closed box.
  const [open, setOpen] = React.useState(depth === 0);
  const isSelected = selectedFolderId === folder.id;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md pr-1 hover:bg-white/5",
          isSelected && "bg-sidebar-primary/90",
        )}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
        <button
          type="button"
          onClick={() => {
            onSelectFolder(folder.id);
            if (hasChildren) setOpen((v) => !v);
          }}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left text-sm"
        >
          {hasChildren ? (
            <ChevronRight
              className={cn(
                "size-3.5 shrink-0 text-foreground/40 transition-transform",
                open && "rotate-90",
              )}
            />
          ) : (
            <span className="size-3.5 shrink-0" />
          )}
          {open && hasChildren ? (
            <FolderOpen className="size-4 shrink-0 text-foreground/60" />
          ) : (
            <Folder className="size-4 shrink-0 text-foreground/60" />
          )}
          <span className="truncate">{folder.name}</span>
        </button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Add subfolder to ${folder.name}`}
          className="opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onAddSubfolder(folder.id)}
        >
          <Plus className="size-3" />
        </Button>
      </div>

      {open && (
        <div>
          {children.map((child) => (
            <FolderNode key={child.id} {...props} folder={child} depth={depth + 1} />
          ))}
          {docs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => onSelectDocument(doc.id)}
              className={cn(
                "flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-sm hover:bg-white/5",
                selectedDocumentId === doc.id && "bg-sidebar-primary/90",
              )}
              style={{ paddingLeft: `${(depth + 1) * 14 + 22}px` }}
            >
              <FileText className="size-3.5 shrink-0 text-foreground/50" />
              <span className="truncate">{doc.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function KnowledgeTree(props: KnowledgeTreeProps) {
  const roots = props.folders.filter((f) => !f.parentId);
  return (
    <div className="flex flex-col gap-0.5">
      {roots.map((folder) => (
        <FolderNode key={folder.id} {...props} folder={folder} depth={0} />
      ))}
    </div>
  );
}
