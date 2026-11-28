"use client";

// Erro no próprio layout raiz: sem estilos do app, então a página é simples e se basta.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif", background: "#141418", color: "#ececf1", textAlign: "center", padding: 24 }}>
        <div>
          <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 12, opacity: 0.6 }}>Algo deu errado</p>
          <h1 style={{ fontSize: 28, margin: "8px 0" }}>O mapa inteiro se apagou</h1>
          <p style={{ opacity: 0.7 }}>O app tropeçou ao abrir. Tente de novo.</p>
          <button type="button" onClick={reset} style={{ marginTop: 16, padding: "12px 20px", borderRadius: 10, border: "none", background: "#6b5bd6", color: "#fff", fontSize: 16 }}>
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
