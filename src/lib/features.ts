// Lightweight feature flags. No env wiring, no CI — flip the constant and
// redeploy. Good enough for small-surface gating like "hide a section until
// real content exists". If we ever need runtime flags, replace this with a
// proper provider; until then, a const is the simplest possible thing.

export const features = {} as const;
