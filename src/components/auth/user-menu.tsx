"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  displayName: string | null;
  role: string;
  locale: string;
}

export function UserMenu({ displayName, role, locale }: UserMenuProps) {
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
        {displayName ?? tAuth("profile")}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/${locale}/dashboard`)}>
          {t("dashboard")}
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
