import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Hero block for the tool landing pages (Images, Video, Canvas, Apparel,
 * Super Agent).
 *
 * The headline sits *on* the --gradient-hero glow rather than on a flat card,
 * and runs at display scale — this is the "personality" treatment from Phase
 * 4.5 Part D. Pages with a dense working UI (Social sub-pages, Settings) use a
 * plain header instead; the glow is reserved so it stays an event.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  children,
  align = "left",
  size = "lg",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Rendered under the description — chat bars, prompt pills, etc. */
  children?: ReactNode;
  align?: "left" | "center";
  size?: "lg" | "sm";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-2xl border border-subtle",
        centered ? "px-6 py-14 md:px-10 md:py-20" : "px-6 py-10 md:px-8 md:py-12",
        className,
      )}
    >
      {/* Glow layer. aria-hidden + pointer-events-none so it never intercepts
          clicks on the content stacked above it. */}
      <div
        aria-hidden
        className="bg-gradient-hero pointer-events-none absolute inset-0 -z-10"
      />

      <div
        className={cn(
          "flex flex-col gap-4",
          centered && "items-center text-center",
        )}
      >
        {eyebrow && (
          <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/55">
            {eyebrow}
          </span>
        )}

        <div
          className={cn(
            "flex w-full flex-wrap items-end gap-4",
            centered ? "justify-center" : "justify-between",
          )}
        >
          <h1
            className={cn(
              size === "lg" ? "text-display" : "text-display-sm",
              "uppercase",
              centered ? "max-w-3xl" : "max-w-[14ch]",
            )}
          >
            {title}
          </h1>
          {actions && <div className="flex items-center gap-2 pb-1">{actions}</div>}
        </div>

        {description && (
          <p
            className={cn(
              "text-sm text-foreground/65",
              centered ? "max-w-xl" : "max-w-2xl",
            )}
          >
            {description}
          </p>
        )}

        {children}
      </div>
    </section>
  );
}
