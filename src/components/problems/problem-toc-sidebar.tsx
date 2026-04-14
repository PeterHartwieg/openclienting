import type { LucideIcon } from "lucide-react";

interface TocItem {
  id: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface Contributor {
  name: string;
  org?: string | null;
  count: number;
}

interface ProblemTocSidebarProps {
  items: TocItem[];
  contributors: Contributor[];
}

export function ProblemTocSidebar({ items, contributors }: ProblemTocSidebarProps) {
  return (
    <aside className="hidden lg:block w-72 shrink-0">
      <div className="sticky top-24 space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            On this page
          </h3>
          <nav className="mt-3 space-y-0.5">
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </span>
                {item.count !== undefined && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground tabular-nums">
                    {item.count}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>

        {contributors.length > 0 && (
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contributors
            </h3>
            <ul className="mt-3 space-y-2.5">
              {contributors.map((c, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium leading-tight">{c.name}</div>
                    {c.org && (
                      <div className="truncate text-xs text-muted-foreground">{c.org}</div>
                    )}
                  </div>
                  {c.count > 1 && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {c.count}
                      {"\u00D7"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
