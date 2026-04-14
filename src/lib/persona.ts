// Homepage persona toggle state. Persisted in an HTTP cookie so the Next.js
// Server Component can render the correct hero on first byte (no flash of
// wrong persona). The client component writes the cookie directly via
// document.cookie on toggle — no Server Action is needed because the value
// is non-sensitive and only controls which hero copy renders.

export const PERSONA_COOKIE = "oc_persona";

export type Persona = "sme" | "startup";

export const DEFAULT_PERSONA: Persona = "sme";

export function parsePersona(raw: string | undefined): Persona {
  return raw === "startup" ? "startup" : DEFAULT_PERSONA;
}

/** Client-only. Writes the persona cookie with a 1-year expiry. */
export function writePersonaCookie(persona: Persona): void {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${PERSONA_COOKIE}=${persona}; path=/; max-age=${oneYear}; SameSite=Lax`;
}
