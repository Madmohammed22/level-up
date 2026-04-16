"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1.5rem",
          background: "#fafafa",
          color: "#111",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#dc2626",
              margin: 0,
            }}
          >
            Erreur critique
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              margin: "0.5rem 0 0.75rem",
            }}
          >
            L&apos;application a rencontré un problème
          </h1>
          <p style={{ fontSize: 14, color: "#52525b" }}>
            Merci de recharger la page. Si le problème persiste, contacte
            l&apos;administrateur.
          </p>
          {error.digest ? (
            <p
              style={{
                fontSize: 12,
                color: "#a1a1aa",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                marginTop: "0.75rem",
              }}
            >
              Réf : {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              background: "#18181b",
              color: "#fafafa",
              border: "none",
              borderRadius: 8,
              padding: "0.5rem 1rem",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Recharger
          </button>
        </div>
      </body>
    </html>
  );
}
