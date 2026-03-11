import { ImageResponse } from "next/og";

// Apple Touch Icon: 180×180
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#0a0e17",
          borderRadius: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {/* 折线图标 */}
        <svg width="90" height="70" viewBox="0 0 90 70" fill="none">
          <polyline
            points="5,60 25,38 42,50 70,15"
            stroke="#38bdf8"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* 底部基准线 */}
          <line x1="5" y1="65" x2="85" y2="65" stroke="#1e3a4c" strokeWidth="3" strokeLinecap="round" />
          {/* 顶点光晕圆点 */}
          <circle cx="70" cy="15" r="7" fill="#38bdf8" opacity="0.3" />
          <circle cx="70" cy="15" r="4" fill="#38bdf8" />
        </svg>
        {/* SP 文字标识 */}
        <div
          style={{
            color: "#38bdf8",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 3,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          SP
        </div>
      </div>
    ),
    { ...size }
  );
}
