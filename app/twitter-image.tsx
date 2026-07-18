import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Agent Readiness Index — Can your AI agents safely touch production?"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function TwitterImage() {
  let fontData: ArrayBuffer | null = null
  try {
    const res = await fetch(
      "https://fonts.gstatic.com/s/archivo/v20/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q55.woff2"
    )
    if (res.ok) fontData = await res.arrayBuffer()
  } catch {
    // fall through — system font fallback
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#F6F5F1",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          fontFamily: fontData ? "Archivo" : "system-ui, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#6b6b65",
            marginBottom: 32,
          }}
        >
          VaultKit
        </div>

        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
            color: "#1a1a18",
            maxWidth: 780,
            marginBottom: 32,
          }}
        >
          Agent Readiness Index
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: "#4a4a44",
            maxWidth: 680,
            lineHeight: 1.4,
            marginBottom: 56,
          }}
        >
          Can your AI agents safely touch production?
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            border: "2px solid #1a1a18",
            padding: "12px 24px",
            width: "fit-content",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              background: "#2d6a4f",
              borderRadius: "50%",
            }}
          />
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#1a1a18",
            }}
          >
            Find out in 10 minutes
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 56,
            right: 96,
            fontSize: 16,
            color: "#8a8a82",
            fontWeight: 500,
          }}
        >
          readiness.vaultkit.io
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "Archivo", data: fontData, style: "normal", weight: 800 }]
        : [],
    }
  )
}
