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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#94a3b8",
          }}
        >
          {siteConfig.name.toLowerCase()}.org
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
