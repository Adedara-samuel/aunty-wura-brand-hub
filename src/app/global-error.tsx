"use client";

/* Last-resort error page (e.g. the database can't be reached while rendering the site layout). */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f3ee",
          color: "#1f1a17",
          fontFamily: "Georgia, 'Times New Roman', serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 460 }}>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6e625a" }}>
            Temporarily unavailable
          </p>
          <h1 style={{ fontSize: 44, fontWeight: 400, margin: "16px 0" }}>We&apos;ll be right back</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", color: "#6e625a", lineHeight: 1.6 }}>
            The website couldn&apos;t load just now. Please try again in a moment.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              border: 0,
              borderRadius: 999,
              padding: "12px 24px",
              background: "#1f1a17",
              color: "#fff",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
