import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CookieSettingsButton } from "./cookie-settings-button";
import { LanguageSwitcher } from "./language-switcher";

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations("footer");
  const tCommon = await getTranslations("common");

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand — full width on mobile */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-lg font-bold tracking-tight text-primary">
              {tCommon("appName")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {t("tagline")}
            </p>
            <div className="mt-4">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold">{t("platform")}</h4>
            <nav className="mt-3 flex flex-col gap-2">
              <Link
                href={`/${locale}/problems`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("browseProblems")}
              </Link>
              <Link
                href={`/${locale}/submit`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("submitProblem")}
              </Link>
              <Link
                href={`/${locale}/venture-clienting`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("ventureClienting")}
              </Link>
              <Link
                href={`/${locale}/dashboard`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("howItWorks")}
              </Link>
            </nav>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-sm font-semibold">{t("community")}</h4>
            <nav className="mt-3 flex flex-col gap-2">
              <a
                href="https://github.com/PeterHartwieg/openclienting"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("github")}
              </a>
              <a
                href="https://github.com/PeterHartwieg/openclienting/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("contact")}
              </a>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold">{t("legal")}</h4>
            <nav className="mt-3 flex flex-col gap-2">
              <Link
                href={`/${locale}/impressum`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("impressum")}
              </Link>
              <Link
                href={`/${locale}/privacy`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("privacy")}
              </Link>
              <Link
                href={`/${locale}/terms`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("terms")}
              </Link>
              <CookieSettingsButton />
            </nav>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            OpenClienting.org &mdash; {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
