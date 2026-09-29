import { ImageResponse } from "next/og";

export const alt = "Sohen Patel, AI / ML Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#f8f8fc", color: "#15162b" }}>
        <div style={{ fontSize: 26, color: "#3b4cca", letterSpacing: 4, textTransform: "uppercase" }}>AI / ML Engineer</div>
        <div style={{ fontSize: 108, fontWeight: 700, marginTop: 16 }}>Sohen Patel</div>
        <div style={{ fontSize: 38, marginTop: 24, color: "#6b6a63", maxWidth: 950 }}>
          I build and evaluate LLM, agentic and applied ML systems, and I measure whether they work.
        </div>
      </div>
    ),
    size,
  );
}
