"use client";

import { Button, ButtonLink } from "@fellowship/ui";
import Link from "next/link";
import { useEffect } from "react";
import { ErrorScreen } from "@/components/common/ErrorScreen";

/** Erro inesperado numa página: tenta de novo sem recarregar tudo. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  return (
    <div style={{ minHeight: "100%", flex: 1, display: "flex" }}>
      <ErrorScreen
        code={offline ? "Sem conexão" : "Algo deu errado"}
        title={offline ? "A ponte caiu (sem internet)" : "Uma armadilha disparou"}
        actions={
          <>
            <Button variant="primary" icon="dice" onClick={reset}>
              Tentar de novo
            </Button>
            <ButtonLink href="/" linkAs={Link} icon="home">
              Voltar ao início
            </ButtonLink>
          </>
        }
      >
        {offline
          ? "Parece que você está sem internet. Assim que a conexão voltar, tente de novo."
          : "Esta página tropeçou em alguma coisa. Tente de novo; se continuar, recarregue o app."}
        {error.digest && !offline ? ` (código ${error.digest})` : ""}
      </ErrorScreen>
    </div>
  );
}
