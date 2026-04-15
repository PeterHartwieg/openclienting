import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// 32×32 favicon — tile + brackets, no dot (md variant geometry, light theme)
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: 32, height: 32, display: "flex" }}>
        <svg
          width={32}
          height={32}
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="t"
              x1="20"
              y1="8"
              x2="20"
              y2="40"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#5aaad4" />
              <stop offset="50%" stopColor="#2773a5" />
              <stop offset="100%" stopColor="#155f90" />
            </linearGradient>
            <linearGradient
              id="a"
              x1="28"
              y1="8"
              x2="28"
              y2="40"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#f0c860" />
              <stop offset="50%" stopColor="#d4924a" />
              <stop offset="100%" stopColor="#b06820" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="46" height="46" rx="10" fill="#dceef7" />
          <polyline
            points="20,8 8,24 20,40"
            fill="none"
            stroke="url(#t)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="28,8 40,24 28,40"
            fill="none"
            stroke="url(#a)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
