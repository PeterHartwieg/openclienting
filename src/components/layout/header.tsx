import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/roles";
import { LoginDialog } from "@/components/auth/login-dialog";
import { UserMenu } from "@/components/auth/user-menu";

export async function Header({ locale }: { locale: string }) {
  const user = await getCurrentUser();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={`/${locale}`} className="text-xl font-bold tracking-tight">
          OpenClienting
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href={`/${locale}/problems`}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse Problems
          </Link>
          <Link
            href={`/${locale}/submit`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Submit Problem
          </Link>
          {user ? (
            <UserMenu
              displayName={user.profile?.display_name ?? null}
              role={user.profile?.role ?? "contributor"}
              locale={locale}
            />
          ) : (
            <LoginDialog>{null}</LoginDialog>
          )}
        </nav>
      </div>
    </header>
  );
}
