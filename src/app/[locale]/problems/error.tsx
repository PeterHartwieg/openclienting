"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function BrowseError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <ErrorState
        title="Failed to load problems"
        message="We couldn't load the problems list. Please try again."
        onRetry={reset}
      />
    </div>
  );
}
