"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Eye, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Markdown rendering styled against the brand tokens. Tailwind's typography
 * plugin isn't installed, so element styles are mapped explicitly — which also
 * keeps every color on a token rather than a prose default.
 */
export function MarkdownView({ content }: { content: string }) {
  if (!content.trim()) {
    return <p className="text-sm text-foreground/40">This document is empty.</p>;
  }
  return (
    <div className="flex flex-col gap-3 text-sm text-foreground/80">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => (
            <h1 className="font-heading text-xl font-semibold tracking-tight" {...props} />
          ),
          h2: (props) => (
            <h2 className="mt-2 font-heading text-base font-semibold" {...props} />
          ),
          h3: (props) => (
            <h3 className="mt-1 font-heading text-sm font-semibold" {...props} />
          ),
          p: (props) => <p className="leading-relaxed" {...props} />,
          ul: (props) => <ul className="list-disc pl-5 leading-relaxed" {...props} />,
          ol: (props) => <ol className="list-decimal pl-5 leading-relaxed" {...props} />,
          a: (props) => (
            <a
              className="text-accent-brand underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
              {...props}
            />
          ),
          blockquote: (props) => (
            <blockquote
              className="border-l-2 border-accent-brand/50 pl-3 text-foreground/60"
              {...props}
            />
          ),
          code: (props) => (
            <code
              className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em]"
              {...props}
            />
          ),
          pre: (props) => (
            <pre
              className="overflow-x-auto rounded-lg border border-subtle bg-white/5 p-3 font-mono text-xs"
              {...props}
            />
          ),
          table: (props) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs" {...props} />
            </div>
          ),
          th: (props) => (
            <th
              className="border border-subtle px-2 py-1 text-left font-semibold"
              {...props}
            />
          ),
          td: (props) => (
            <td className="border border-subtle px-2 py-1" {...props} />
          ),
          hr: () => <hr className="border-subtle" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function MarkdownEditor({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  const [mode, setMode] = React.useState<"write" | "preview">("write");

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex w-fit items-center gap-1 rounded-lg border border-subtle bg-surface-card p-1">
        <Button
          size="sm"
          variant={mode === "write" ? "secondary" : "ghost"}
          onClick={() => setMode("write")}
          className="gap-1.5"
        >
          <Pencil className="size-3.5" /> Write
        </Button>
        <Button
          size="sm"
          variant={mode === "preview" ? "secondary" : "ghost"}
          onClick={() => setMode("preview")}
          className="gap-1.5"
        >
          <Eye className="size-3.5" /> Preview
        </Button>
      </div>

      {mode === "write" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={"# Heading\n\nWrite in markdown — headings, lists, tables, and code blocks all render."}
          className="min-h-80 w-full resize-y rounded-lg border border-subtle bg-transparent p-3 font-mono text-xs leading-relaxed outline-none focus-visible:border-accent-brand/60"
        />
      ) : (
        <div className="min-h-80 rounded-lg border border-subtle bg-white/5 p-4">
          <MarkdownView content={value} />
        </div>
      )}
    </div>
  );
}
