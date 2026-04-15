import { useId } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Brand glyph primitives — extracted from src/components/logo.tsx
//
// The brand mark is two brackets + a center dot:
//   - blue/teal left bracket  = corporate / SME side (problems)
//   - orange/amber right bracket = startup side (solutions)
//   - center dot = the match / validated collaboration
//
// BrandMark renders the paired glyph and accepts a `state` prop to highlight
// one side, both sides, or the full match (with dot).
//
// BrandBracket renders a single side as a compact accent glyph, useful for
// small UI elements (badges, inline markers, etc.).
//
// Both share the same gradient palette as the main Logo so everything feels
// like one system. Gradient IDs are scoped per-instance via React.useId() so
// multiple marks on the same page don't collide.
// ---------------------------------------------------------------------------

export type BracketSide = "corporate" | "startup";
export type BrandMarkState = "corporate" | "startup" | "match" | "both";

interface BrandMarkProps {
  /** Which side(s) of the mark are active. Inactive side fades to muted. */
  state?: BrandMarkState;
  /** Pixel size (width & height). Default 48. */
  size?: number;
  /** Render the rounded app-icon tile behind the glyph. */
  tile?: boolean;
  className?: string;
  /** If set, the SVG is exposed as an image with this label. */
  ariaLabel?: string;
}

export function BrandMark({
  state = "match",
  size = 48,
  tile = false,
  className,
  ariaLabel,
}: BrandMarkProps) {
  const uid = useId();
  const tealLight = `bm-teal-l-${uid}`;
  const amberLight = `bm-amber-l-${uid}`;
  const tealDark = `bm-teal-d-${uid}`;
  const amberDark = `bm-amber-d-${uid}`;

  const tealActive = state !== "startup";
  const amberActive = state !== "corporate";
  const showDot = state === "match";

  const tealOpacity = tealActive ? 1 : 0.22;
  const amberOpacity = amberActive ? 1 : 0.22;

  // Inline transitions are respected by our prefers-reduced-motion rule in
  // globals.css (transition-duration: 0.01ms !important).
  const fadeStyle = { transition: "opacity 220ms ease-out" } as const;

  return (
    <span
      className={cn("inline-block align-middle", className)}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      {/* ── light ── */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width={size}
        height={size}
        className="dark:hidden"
      >
        <defs>
          <linearGradient id={tealLight} x1="20" y1="8" x2="20" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5aaad4" />
            <stop offset="50%" stopColor="#2773a5" />
            <stop offset="100%" stopColor="#155f90" />
          </linearGradient>
          <linearGradient id={amberLight} x1="28" y1="8" x2="28" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f0c860" />
            <stop offset="50%" stopColor="#d4924a" />
            <stop offset="100%" stopColor="#b06820" />
          </linearGradient>
        </defs>
        {tile && <rect x="1" y="1" width="46" height="46" rx="10" fill="#dceef7" />}
        <polyline
          points="20,8 8,24 20,40"
          fill="none"
          stroke={`url(#${tealLight})`}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={tealOpacity}
          style={fadeStyle}
        />
        <polyline
          points="28,8 40,24 28,40"
          fill="none"
          stroke={`url(#${amberLight})`}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={amberOpacity}
          style={fadeStyle}
        />
        {showDot && <circle cx="24" cy="24" r="2.8" fill="#2a3a4a" opacity="0.55" />}
      </svg>

      {/* ── dark ── */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width={size}
        height={size}
        className="hidden dark:block"
      >
        <defs>
          <linearGradient id={tealDark} x1="20" y1="8" x2="20" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#80c8e8" />
            <stop offset="50%" stopColor="#5aa0cc" />
            <stop offset="100%" stopColor="#2e78a8" />
          </linearGradient>
          <linearGradient id={amberDark} x1="28" y1="8" x2="28" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f8d878" />
            <stop offset="50%" stopColor="#e0a85a" />
            <stop offset="100%" stopColor="#b87030" />
          </linearGradient>
        </defs>
        {tile && <rect x="1" y="1" width="46" height="46" rx="10" fill="#1f3044" />}
        <polyline
          points="20,8 8,24 20,40"
          fill="none"
          stroke={`url(#${tealDark})`}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={tealOpacity}
          style={fadeStyle}
        />
        <polyline
          points="28,8 40,24 28,40"
          fill="none"
          stroke={`url(#${amberDark})`}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={amberOpacity}
          style={fadeStyle}
        />
        {showDot && <circle cx="24" cy="24" r="2.8" fill="#a0b8cc" opacity="0.55" />}
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------------
// BrandBracket — a single bracket (corporate or startup), for small accents.
// Uses a narrower viewBox so it sits flush alongside text at badge sizes.
// ---------------------------------------------------------------------------

interface BrandBracketProps {
  side: BracketSide;
  /** Height in px. Width scales to maintain the narrow bracket aspect. */
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export function BrandBracket({
  side,
  size = 16,
  className,
  ariaLabel,
}: BrandBracketProps) {
  const uid = useId();
  const light = `bb-l-${uid}`;
  const dark = `bb-d-${uid}`;

  // viewBox 0 0 16 32 — stroke 4, 4px inset
  const points =
    side === "corporate" ? "12,4 4,16 12,28" : "4,4 12,16 4,28";

  // Light/dark gradient stops for the relevant side.
  const lightStops =
    side === "corporate"
      ? (["#5aaad4", "#2773a5", "#155f90"] as const)
      : (["#f0c860", "#d4924a", "#b06820"] as const);
  const darkStops =
    side === "corporate"
      ? (["#80c8e8", "#5aa0cc", "#2e78a8"] as const)
      : (["#f8d878", "#e0a85a", "#b87030"] as const);

  const height = size;
  const width = Math.round(size / 2);

  return (
    <span
      className={cn("inline-block align-middle", className)}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 32"
        width={width}
        height={height}
        className="dark:hidden"
      >
        <defs>
          <linearGradient id={light} x1="8" y1="4" x2="8" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={lightStops[0]} />
            <stop offset="50%" stopColor={lightStops[1]} />
            <stop offset="100%" stopColor={lightStops[2]} />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke={`url(#${light})`}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 32"
        width={width}
        height={height}
        className="hidden dark:block"
      >
        <defs>
          <linearGradient id={dark} x1="8" y1="4" x2="8" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={darkStops[0]} />
            <stop offset="50%" stopColor={darkStops[1]} />
            <stop offset="100%" stopColor={darkStops[2]} />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke={`url(#${dark})`}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
