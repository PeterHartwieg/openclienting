import type { ReactNode } from "react";
import { BrandMark, type BrandMarkState } from "@/components/brand/brand-mark";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// EmptyState — shared placeholder for "no results", "nothing here yet", and
// "success, nothing to do" states. It replaces the ad-hoc
//   <div className="rounded-lg border border-dashed p-12 text-center">...</div>
// pattern sprinkled across pages. The branded tile uses BrandMark so empty
// states feel like part of the system rather than generic fallbacks.
//
// The `state` prop maps to the brand metaphor:
//   - "match"     → search/filter empty (the bridge — matches the metaphor of
//                   corporate needs meeting startup solutions)
//   - "corporate" → "no problems yet" in corporate-facing surfaces
//   - "startup"   → "no approaches yet" in startup-facing surfaces
//   - "both"      → neutral paired mark without the dot
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  /** Short title (h3). Optional — if omitted, only the message shows. */
  title?: string;
  /** Body copy. Can be plain text or a ReactNode for richer content. */
  message: ReactNode;
  /** Optional CTA or secondary content below the message. */
  action?: ReactNode;
  /** Which brand mark state to show. Default "match". */
  state?: BrandMarkState;
  className?: string;
}

export function EmptyState({
  title,
  message,
  action,
  state = "match",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center",
        className,
      )}
    >
      <BrandMark state={state} size={56} tile />
      <div>
        {title && (
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        )}
        <div
          className={cn(
            "text-sm text-muted-foreground",
            title && "mt-1",
          )}
        >
          {message}
        </div>
      </div>
      {action}
    </div>
  );
}
