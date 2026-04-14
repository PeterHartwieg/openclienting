import { getTranslations } from "next-intl/server";
import { AlertTriangle } from "lucide-react";

interface LegalShellProps {
  reviewPending?: boolean;
  children: React.ReactNode;
}

/**
 * Wrapper for legal pages. Renders a yellow banner above translated legal
 * pages that have not yet been reviewed by a lawyer, so users (and lawyers)
 * know to fall back to the English version when in doubt.
 */
export async function LegalShell({
  reviewPending = false,
  children,
}: LegalShellProps) {
  const t = await getTranslations("legal");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {reviewPending && (
        <div className="mb-8 flex items-start gap-3 rounded-md border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-900 dark:text-yellow-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
          <p>{t("reviewPending")}</p>
        </div>
      )}
      {children}
    </div>
  );
}
