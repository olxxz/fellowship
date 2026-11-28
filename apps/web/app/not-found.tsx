import { ButtonLink } from "@fellowship/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ErrorScreen } from "@/components/common/ErrorScreen";

export const metadata: Metadata = { title: "Caminho não encontrado" };

export default function NotFound() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex" }}>
      <ErrorScreen
        code="Erro 404"
        title="Este caminho não está no mapa"
        actions={
          <>
            <ButtonLink href="/" linkAs={Link} variant="primary" icon="home">
              Voltar ao início
            </ButtonLink>
            <ButtonLink href="/aventuras" linkAs={Link} icon="book">
              Jogar uma aventura
            </ButtonLink>
          </>
        }
      >
        O link pode estar errado, a página pode ter mudado de lugar, ou alguém apagou esta parte do mundo. Acontece com os melhores
        aventureiros.
      </ErrorScreen>
    </div>
  );
}
