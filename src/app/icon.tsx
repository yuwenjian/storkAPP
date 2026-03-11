import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#0a0e17",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* 简单折线图标：三段上升折线 */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <polyline
            points="2,14 7,9 11,12 18,4"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="18" cy="4" r="2" fill="#38bdf8" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
