"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AuthorAvatar } from "@/components/shared/author-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  locale: string;
}

export function UserMenu({
  displayName,
  avatarUrl,
  role,
  locale,
}: UserMenuProps) {
  const router = useRouter();
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
        <span className="inline-flex items-center gap-2">
          <AuthorAvatar
            avatarUrl={avatarUrl}
            name={displayName}
            size={22}
          />
          {displayName ?? tAuth("profile")}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/${locale}/dashboard`)}>
          {t("dashboard")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/${locale}/dashboard/account`)}
        >
          {tAuth("accountSettings")}
        </DropdownMenuItem>
        {(role === "moderator" || role === "admin") && (
          <DropdownMenuItem onClick={() => router.push(`/${locale}/moderate`)}>
            {t("moderate")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          {tAuth("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
