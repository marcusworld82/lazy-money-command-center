"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface BrowseCategory {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface BrowseCard {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  /** Optional thumbnail. Falls back to an icon tile when absent. */
  imageUrl?: string;
  icon?: LucideIcon;
  /** Corner tag, e.g. "New" or "Top". */
  badge?: string;
}

/**
 * Two-column browse layout: category rows on the left, a card grid on the right.
 *
 * Built as a reusable shell in Phase 4.5 — Phase 5 feeds it real model data.
 * It takes categories/cards as props and owns only selection state, so nothing
 * about the placeholder content is baked in.
 */
export function ExploreBrowse({
  categories,
  cards,
  onSelectCard,
  selectedCardId,
  className,
}: {
  categories: BrowseCategory[];
  cards: BrowseCard[];
  onSelectCard?: (card: BrowseCard) => void;
  selectedCardId?: string;
  className?: string;
}) {
  const [activeCategory, setActiveCategory] = React.useState(
    categories[0]?.id ?? "",
  );

  const visible = cards.filter((c) => c.categoryId === activeCategory);

  return (
    <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]", className)}>
      <div className="flex flex-col gap-1">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = category.id === activeCategory;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                isActive
                  ? "border-accent-brand/60 bg-accent-brand/10"
                  : "border-transparent hover:bg-white/5",
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  isActive ? "text-accent-brand" : "text-foreground/50",
                )}
              />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium">{category.label}</span>
                <span className="text-xs text-foreground/50">
                  {category.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.length === 0 ? (
          <p className="text-xs text-foreground/45">Nothing in this category yet.</p>
        ) : (
          visible.map((card) => {
            const Icon = card.icon;
            return (
              <Panel
                as="button"
                key={card.id}
                interactive
                onClick={() => onSelectCard?.(card)}
                className={cn(
                  "relative flex flex-col gap-2 p-3 text-left",
                  selectedCardId === card.id && "border-accent-brand",
                )}
              >
                {card.badge && (
                  <Badge
                    variant="secondary"
                    className="absolute top-4 right-4 z-10 text-[10px]"
                  >
                    {card.badge}
                  </Badge>
                )}
                <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-subtle bg-white/5">
                  {card.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.imageUrl}
                      alt={card.title}
                      className="size-full object-cover"
                    />
                  ) : Icon ? (
                    <Icon className="size-6 text-foreground/40" />
                  ) : null}
                </div>
                <span className="font-heading text-sm font-semibold">{card.title}</span>
                <span className="text-xs text-foreground/55">{card.description}</span>
              </Panel>
            );
          })
        )}
      </div>
    </div>
  );
}
