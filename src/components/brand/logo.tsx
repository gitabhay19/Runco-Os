import { cn } from "@/lib/utils";

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface LogoProps {
  className?: string;
  size?: LogoSize;
  showDot?: boolean;
  shimmer?: boolean;
}

const SIZE_MAP: Record<LogoSize, { text: string; dot: string; gap: string; offset: string }> = {
  xs: { text: "text-[13px]", dot: "h-[4px] w-[4px]", gap: "gap-1", offset: "mt-[-9px]" },
  sm: { text: "text-[16px]", dot: "h-[5px] w-[5px]", gap: "gap-1.5", offset: "mt-[-11px]" },
  md: { text: "text-[20px]", dot: "h-[6px] w-[6px]", gap: "gap-1.5", offset: "mt-[-14px]" },
  lg: { text: "text-[28px]", dot: "h-[7px] w-[7px]", gap: "gap-2", offset: "mt-[-19px]" },
  xl: { text: "text-[40px]", dot: "h-[10px] w-[10px]", gap: "gap-2.5", offset: "mt-[-28px]" },
  "2xl": { text: "text-[56px]", dot: "h-[14px] w-[14px]", gap: "gap-3", offset: "mt-[-40px]" },
};

/**
 * Runco wordmark — premium tracking, optional brand-blue accent dot.
 * Use `shimmer` for an animated text-gradient on hero placements.
 */
export function Logo({ className, size = "sm", showDot = false, shimmer = false }: LogoProps) {
  const s = SIZE_MAP[size];
  return (
    <div className={cn("inline-flex items-end leading-none", s.gap, className)}>
      <span
        className={cn(
          "font-display font-bold tracking-[-0.04em] leading-none",
          s.text,
          shimmer && "shimmer"
        )}
      >
        RUNCO
      </span>
      {showDot && (
        <span
          className={cn(
            "rounded-full bg-[hsl(var(--brand))] shadow-[0_0_12px_hsl(var(--brand)/0.6)]",
            s.dot,
            s.offset
          )}
          aria-hidden
        />
      )}
    </div>
  );
}
