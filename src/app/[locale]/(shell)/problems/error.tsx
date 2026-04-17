"use client";

import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/shared/error-state";

export default function BrowseError({ reset }: { reset: () => void }) {
  const t = useTranslations("problemsList");
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <ErrorState
        title={t("errorTitle")}
        message="We couldn't load the problems list. Please try again."
        onRetry={reset}
      />
    </div>
  );
}
