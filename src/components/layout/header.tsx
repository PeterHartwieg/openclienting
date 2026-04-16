import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/roles";
import { LoginDialog } from "@/components/auth/login-dialog";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PublicNav } from "@/components/layout/public-nav";
import { Logo } from "@/components/logo";

export async function Header({ locale }: { locale: string }) {
  const [user, t] = await Promise.all([
    getCurrentUser(),
    getTranslations("nav"),
  ]);

  const authSlot = user ? (
    <UserMenu
      displayName={user.profile?.display_name ?? null}
      avatarUrl={user.profile?.avatar_url ?? null}
      role={user.profile?.role ?? "contributor"}
      locale={locale}
    />
  ) : (
    <LoginDialog />
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href={`/${locale}`}
            className="flex items-center"
            aria-label="OpenClienting — home"
          >
            <Logo variant="compact" />
          </Link>
          <PublicNav locale={locale} />
        </div>

        {/* Desktop utilities */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link
            href={`/${locale}/submit`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            {t("submit")}
          </Link>
          {authSlot}
        </div>

        {/* Mobile utilities */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <MobileNav locale={locale} authSlot={authSlot} />
        </div>
      </div>
    </header>
  );
}
