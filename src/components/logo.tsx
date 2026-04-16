import type { FC } from "react";
import { cn } from "@/lib/utils";

export type LogoVariant = "wordmark" | "compact" | "icon";
export type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  /** Only applies to variant="icon" */
  size?: LogoSize;
  className?: string;
}

const FONT = "'IBM Plex Sans', system-ui, sans-serif";

// ---------------------------------------------------------------------------
// Wordmark  — icon (no tile) + "OpenClienting.org"   viewBox 0 0 300 52
// ---------------------------------------------------------------------------
function WordmarkLogo({ className }: { className?: string }) {
  return (
    <span dir="ltr" className={cn("inline-block", className)}>
      {/* ── light ── */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 300 52"
        width="300"
        height="52"
        role="img"
        aria-label="OpenClienting.org"
        className="dark:hidden"
      >
        <defs>
          <linearGradient id="wm-teal-l" x1="20" y1="11" x2="20" y2="41" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#5aaad4" />
            <stop offset="50%"  stopColor="#2773a5" />
            <stop offset="100%" stopColor="#155f90" />
          </linearGradient>
          <linearGradient id="wm-amber-l" x1="28" y1="11" x2="28" y2="41" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#f0c860" />
            <stop offset="50%"  stopColor="#d4924a" />
            <stop offset="100%" stopColor="#b06820" />
          </linearGradient>
        </defs>
        <polyline points="20,11 8,26 20,41"  fill="none" stroke="url(#wm-teal-l)"  strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="28,11 40,26 28,41" fill="none" stroke="url(#wm-amber-l)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="26" r="2.8" fill="#2a3a4a" opacity="0.55" />
        <text fontFamily={FONT} fontSize="24" fontWeight="600" letterSpacing="-0.03em" y="34">
          <tspan x="58" fill="#2773a5">Open</tspan>
          <tspan fill="#1b1c2d">Clienting</tspan>
          <tspan fill="#8a8b9e" fontSize="16" fontWeight="400" dy="2" dx="1">.org</tspan>
        </text>
      </svg>

      {/* ── dark ── */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 300 52"
        width="300"
        height="52"
        role="img"
        aria-label="OpenClienting.org"
        className="hidden dark:block"
      >
        <defs>
          <linearGradient id="wm-teal-d" x1="20" y1="11" x2="20" y2="41" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#80c8e8" />
            <stop offset="50%"  stopColor="#5aa0cc" />
            <stop offset="100%" stopColor="#2e78a8" />
          </linearGradient>
          <linearGradient id="wm-amber-d" x1="28" y1="11" x2="28" y2="41" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#f8d878" />
            <stop offset="50%"  stopColor="#e0a85a" />
            <stop offset="100%" stopColor="#b87030" />
          </linearGradient>
        </defs>
        <polyline points="20,11 8,26 20,41"  fill="none" stroke="url(#wm-teal-d)"  strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="28,11 40,26 28,41" fill="none" stroke="url(#wm-amber-d)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="26" r="2.8" fill="#a0b8cc" opacity="0.55" />
        <text fontFamily={FONT} fontSize="24" fontWeight="600" letterSpacing="-0.03em" y="34">
          <tspan x="58" fill="#5aa0cc">Open</tspan>
          <tspan fill="#eceae6">Clienting</tspan>
          <tspan fill="#9a9baf" fontSize="16" fontWeight="400" dy="2" dx="1">.org</tspan>
        </text>
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Compact  — icon (no tile) + "OpenClienting.org"   viewBox 0 0 270 44
// ---------------------------------------------------------------------------
function CompactLogo({ className }: { className?: string }) {
  return (
    <span dir="ltr" className={cn("inline-block", className)}>
      {/* ── light ── */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 270 44"
        width="270"
        height="44"
        role="img"
        aria-label="OpenClienting.org"
        className="dark:hidden"
      >
        <defs>
          <linearGradient id="cp-teal-l" x1="19" y1="9" x2="19" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#5aaad4" />
            <stop offset="50%"  stopColor="#2773a5" />
            <stop offset="100%" stopColor="#155f90" />
          </linearGradient>
          <linearGradient id="cp-amber-l" x1="25" y1="9" x2="25" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#f0c860" />
            <stop offset="50%"  stopColor="#d4924a" />
            <stop offset="100%" stopColor="#b06820" />
          </linearGradient>
        </defs>
        <polyline points="19,9 8,22 19,35"  fill="none" stroke="url(#cp-teal-l)"  strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="25,9 36,22 25,35" fill="none" stroke="url(#cp-amber-l)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="22" cy="22" r="2.5" fill="#2a3a4a" opacity="0.5" />
        <text fontFamily={FONT} fontSize="21" fontWeight="600" letterSpacing="-0.03em" y="29">
          <tspan x="52" fill="#2773a5">Open</tspan>
          <tspan fill="#1b1c2d">Clienting</tspan>
          <tspan fill="#8a8b9e" fontSize="14" fontWeight="400" dy="1" dx="1">.org</tspan>
        </text>
      </svg>

      {/* ── dark ── */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 270 44"
        width="270"
        height="44"
        role="img"
        aria-label="OpenClienting.org"
        className="hidden dark:block"
      >
        <defs>
          <linearGradient id="cp-teal-d" x1="19" y1="9" x2="19" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#80c8e8" />
            <stop offset="50%"  stopColor="#5aa0cc" />
            <stop offset="100%" stopColor="#2e78a8" />
          </linearGradient>
          <linearGradient id="cp-amber-d" x1="25" y1="9" x2="25" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#f8d878" />
            <stop offset="50%"  stopColor="#e0a85a" />
            <stop offset="100%" stopColor="#b87030" />
          </linearGradient>
        </defs>
        <polyline points="19,9 8,22 19,35"  fill="none" stroke="url(#cp-teal-d)"  strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="25,9 36,22 25,35" fill="none" stroke="url(#cp-amber-d)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="22" cy="22" r="2.5" fill="#a0b8cc" opacity="0.5" />
        <text fontFamily={FONT} fontSize="21" fontWeight="600" letterSpacing="-0.03em" y="29">
          <tspan x="52" fill="#5aa0cc">Open</tspan>
          <tspan fill="#eceae6">Clienting</tspan>
          <tspan fill="#9a9baf" fontSize="14" fontWeight="400" dy="1" dx="1">.org</tspan>
        </text>
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Icon  — tile + brackets (+ dot at lg)   viewBox 0 0 48 48
//   lg = 64 px : tile + brackets + dot
//   md = 32 px : tile + brackets
//   sm = 20 px : tile + brackets, thicker stroke
// ---------------------------------------------------------------------------
const ICON_DIMS: Record<LogoSize, { px: number; stroke: number; dot: boolean }> = {
  lg: { px: 64, stroke: 6, dot: true  },
  md: { px: 32, stroke: 6, dot: false },
  sm: { px: 20, stroke: 7, dot: false },
};

function IconLogo({ size = "lg", className }: { size?: LogoSize; className?: string }) {
  const { px, stroke, dot } = ICON_DIMS[size];
  const idSuffix = size; // "lg" | "md" | "sm" — one per size per page is fine

  return (
    <span dir="ltr" className={cn("inline-block", className)}>
      {/* ── light ── */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width={px}
        height={px}
        role="img"
        aria-label="OpenClienting.org"
        className="dark:hidden"
      >
        <defs>
          <linearGradient id={`ic-teal-l-${idSuffix}`} x1="20" y1="8" x2="20" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#5aaad4" />
            {size !== "sm" && <stop offset="50%" stopColor="#2773a5" />}
            <stop offset="100%" stopColor="#155f90" />
          </linearGradient>
          <linearGradient id={`ic-amber-l-${idSuffix}`} x1="28" y1="8" x2="28" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#f0c860" />
            {size !== "sm" && <stop offset="50%" stopColor="#d4924a" />}
            <stop offset="100%" stopColor="#b06820" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="46" height="46" rx="10" fill="#dceef7" />
        <polyline points="20,8 8,24 20,40"  fill="none" stroke={`url(#ic-teal-l-${idSuffix})`}  strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="28,8 40,24 28,40" fill="none" stroke={`url(#ic-amber-l-${idSuffix})`} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        {dot && <circle cx="24" cy="24" r="2.8" fill="#2a3a4a" opacity="0.55" />}
      </svg>

      {/* ── dark ── */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width={px}
        height={px}
        role="img"
        aria-label="OpenClienting.org"
        className="hidden dark:block"
      >
        <defs>
          <linearGradient id={`ic-teal-d-${idSuffix}`} x1="20" y1="8" x2="20" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#80c8e8" />
            {size !== "sm" && <stop offset="50%" stopColor="#5aa0cc" />}
            <stop offset="100%" stopColor="#2e78a8" />
          </linearGradient>
          <linearGradient id={`ic-amber-d-${idSuffix}`} x1="28" y1="8" x2="28" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#f8d878" />
            {size !== "sm" && <stop offset="50%" stopColor="#e0a85a" />}
            <stop offset="100%" stopColor="#b87030" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="46" height="46" rx="10" fill="#1f3044" />
        <polyline points="20,8 8,24 20,40"  fill="none" stroke={`url(#ic-teal-d-${idSuffix})`}  strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="28,8 40,24 28,40" fill="none" stroke={`url(#ic-amber-d-${idSuffix})`} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        {dot && <circle cx="24" cy="24" r="2.8" fill="#a0b8cc" opacity="0.55" />}
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------
export const Logo: FC<LogoProps> = ({ variant = "wordmark", size = "lg", className }) => {
  if (variant === "icon")    return <IconLogo    size={size} className={className} />;
  if (variant === "compact") return <CompactLogo className={className} />;
  return <WordmarkLogo className={className} />;
};
