import * as React from "react";
import { cn } from "@/lib/utils";

const PANEL_CLASSES =
  "rounded-2xl border border-glass-border bg-glass backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]";
const INTERACTIVE_CLASSES =
  "transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-green/50 hover:shadow-[0_0_0_1px_rgba(22,110,22,0.25),0_12px_40px_-12px_rgba(0,0,0,0.6)]";

interface GlassPanelDivProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article";
  interactive?: boolean;
}

interface GlassPanelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as: "button";
  interactive?: boolean;
}

export type GlassPanelProps = GlassPanelDivProps | GlassPanelButtonProps;

export function GlassPanel({ interactive = false, className, ...props }: GlassPanelProps) {
  const classes = cn(PANEL_CLASSES, interactive && INTERACTIVE_CLASSES, className);

  if (props.as === "button") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { as, ...buttonProps } = props;
    return <button type="button" className={classes} {...buttonProps} />;
  }

  const { as: Tag = "div", ...rest } = props;
  return <Tag className={classes} {...rest} />;
}
