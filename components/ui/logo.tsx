import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-14 w-14 text-2xl",
};

/**
 * The shared MARCO sticker-head mark. Text is deliberately kept outside the
 * mark so the component works at small avatar and PWA icon sizes.
 */
export function Logo({ className, size = "md" }: LogoProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border border-white/15 bg-accent-brand font-heading font-bold tracking-tight text-surface-white",
        "skew-x-[-4deg]",
        SIZES[size],
        className,
      )}
      aria-label="MARCO"
    >
      <img src="/agent-mark.png" alt="" className="h-[82%] w-[82%] object-contain" />
    </div>
  );
}
