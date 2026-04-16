// Rasterizes the OpenClienting wordmark SVG to a transparent PNG for use
// in HTML emails. Gmail and most mobile clients strip inline <svg>, so
// the auth email templates reference this PNG via <img>. Rendered at 2×
// the display dimensions for retina sharpness, then let the email's
// width/height attributes down-scale in the client.
//
// Run with: node scripts/render-email-logo.mjs
//
// Re-run whenever the wordmark colors, spacing, or text change in
// src/components/logo.tsx. The source-of-truth shape is duplicated here
// rather than imported so this script stays a plain Node executable.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUTPUT = path.join(process.cwd(), "public", "brand", "email-logo.png");

// Display dimensions (what the <img> will render at in the email).
const DISPLAY_WIDTH = 270;
const DISPLAY_HEIGHT = 44;
// Render at 2× for retina, then downscale in the email via width/height.
const SCALE = 2;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 44" width="${DISPLAY_WIDTH * SCALE}" height="${DISPLAY_HEIGHT * SCALE}">
  <polyline points="19,9 8,22 19,35"  fill="none" stroke="#2773a5" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="25,9 36,22 25,35" fill="none" stroke="#d4924a" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="22" cy="22" r="2.5" fill="#2a3a4a" opacity="0.5"/>
  <text font-family="-apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif" font-size="21" font-weight="600" letter-spacing="-0.03em" y="29">
    <tspan x="52" fill="#2773a5">Open</tspan><tspan fill="#1b1c2d">Clienting</tspan><tspan fill="#8a8b9e" font-size="14" font-weight="400" dy="1" dx="1">.org</tspan>
  </text>
</svg>`;

const png = await sharp(Buffer.from(svg), { density: 144 })
  .resize(DISPLAY_WIDTH * SCALE, DISPLAY_HEIGHT * SCALE, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9 })
  .toBuffer();

await writeFile(OUTPUT, png);
console.log(
  `Wrote ${OUTPUT} (${png.length} bytes, ${DISPLAY_WIDTH * SCALE}x${DISPLAY_HEIGHT * SCALE} retina)`
);
