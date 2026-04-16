"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function ProblemDetailError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <ErrorState
        title="Problem not found"
        message="We couldn't load this problem. It may have been removed or you may not have access."
        onRetry={reset}
      />
    </div>
  );
}
