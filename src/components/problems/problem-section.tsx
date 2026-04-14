import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Accent = "primary" | "blue" | "violet" | "amber" | "slate";

const accentClasses: Record<Accent, { border: string; bg: string; text: string }> = {
  primary: {
    border: "border-l-primary/70",
    bg: "bg-primary/10",
    text: "text-primary",
  },
  blue: {
    border: "border-l-blue-500/70",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
  },
  violet: {
    border: "border-l-violet-500/70",
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    border: "border-l-amber-500/70",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  slate: {
    border: "border-l-slate-500/70",
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
  },
};

interface ProblemSectionProps {
  id: string;
  icon: LucideIcon;
  title: string;
  count?: number;
  accent: Accent;
  children: React.ReactNode;
}

export function ProblemSection({
  id,
  icon: Icon,
  title,
  count,
  accent,
  children,
}: ProblemSectionProps) {
  const c = accentClasses[accent];
  return (
    <Card id={id} className={`scroll-mt-24 border-l-4 ${c.border}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${c.bg}`}>
            <Icon className={`h-5 w-5 ${c.text}`} />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          {count !== undefined && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
              {count}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
