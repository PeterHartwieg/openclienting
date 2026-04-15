import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

// Next.js picks this up automatically as the default OG image for the whole
// site. 1200x630 is the Facebook/Twitter summary_large_image target size.
// Pages can still override by adding their own `openGraph.images`.

export const runtime = "edge";
export const alt = `${siteConfig.name} - open-source venture clienting knowledge base`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0b0f1a 0%, #111827 50%, #1e293b 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo mark — dark-mode palette on dark background */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg
            width={64}
            height={64}
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="og-t" x1="20" y1="8" x2="20" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#80c8e8" />
                <stop offset="50%"  stopColor="#5aa0cc" />
                <stop offset="100%" stopColor="#2e78a8" />
              </linearGradient>
              <linearGradient id="og-a" x1="28" y1="8" x2="28" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#f8d878" />
                <stop offset="50%"  stopColor="#e0a85a" />
                <stop offset="100%" stopColor="#b87030" />
              </linearGradient>
            </defs>
            <rect x="1" y="1" width="46" height="46" rx="10" fill="#1f3044" />
            <polyline points="20,8 8,24 20,40"  fill="none" stroke="url(#og-t)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="28,8 40,24 28,40" fill="none" stroke="url(#og-a)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="24" r="2.8" fill="#a0b8cc" opacity="0.55" />
          </svg>
          <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
            <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", color: "#5aa0cc" }}>Open</span>
            <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", color: "#eceae6" }}>Clienting</span>
            <span style={{ fontSize: 21, fontWeight: 400, color: "#9a9baf", marginLeft: 2 }}>.org</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: 960,
            }}
          >
            Open-source venture clienting knowledge base
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              color: "#cbd5e1",
              maxWidth: 900,
            }}
          >
            Problem templates, pilot frameworks, and verified outcomes shared
            by SMEs and startups.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
