// Lightweight feature flags. No env wiring, no CI — flip the constant and
// redeploy. Good enough for small-surface gating like "hide a section until
// real content exists". If we ever need runtime flags, replace this with a
// proper provider; until then, a const is the simplest possible thing.

export const features = {
  /**
   * Render the Featured Success Story card on the homepage. Flip to `true`
   * once real pilot content is ready (dummy content lives inside the
   * component for now).
   */
  showFeaturedSuccessStory: false,
} as const;
