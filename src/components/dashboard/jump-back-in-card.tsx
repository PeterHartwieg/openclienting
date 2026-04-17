"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecentNav } from "@/lib/hooks/use-recent-nav";
import { trackIaEvent } from "@/lib/analytics/ia-events";

const MAX_DISPLAY = 5;

export function JumpBackInCard() {
  const t = useTranslations("dashboard");
  const entries = useRecentNav();
  const recent = entries.slice(0, MAX_DISPLAY);

  if (recent.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("overview.recentNav.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {recent.map((entry) => (
            <li key={entry.href}>
              <Link
                href={entry.href}
                onClick={() =>
                  trackIaEvent({
                    name: "ia_dashboard_card_click",
                    card: "recent-nav",
                  })
                }
                className="-mx-1 block truncate rounded-md px-1 py-1.5 text-sm hover:bg-muted/50"
              >
                {entry.label}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
