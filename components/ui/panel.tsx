import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Flat dark card: one shade lighter than the page, thin low-opacity border,
 * medium radius, no blur and no shadow. This replaces the Phase 1 "glass"
 * treatment wholesale (Phase 4.5).
 */
const PANEL_CLASSES = "rounded-xl border border-subtle bg-surface-card";
/** Lift + soft red edge glow. Defined as a utility in globals.css so every
 *  card gets the identical curve rather than each page inventing one. */
const INTERACTIVE_CLASSES = "glow-lift";

interface PanelDivProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article";
  interactive?: boolean;
}

interface PanelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as: "button";
  interactive?: boolean;
}

export type PanelProps = PanelDivProps | PanelButtonProps;

export function Panel({ interactive = false, className, ...props }: PanelProps) {
  const classes = cn(PANEL_CLASSES, interactive && INTERACTIVE_CLASSES, className);

  if (props.as === "button") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { as, ...buttonProps } = props;
    return <button type="button" className={classes} {...buttonProps} />;
  }

  const { as: Tag = "div", ...rest } = props;
  return <Tag className={classes} {...rest} />;
}
