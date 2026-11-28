import { ButtonLink } from "@fellowship/ui";
import Link from "next/link";
import { ErrorScreen } from "@/components/common/ErrorScreen";
import { ContentHeader } from "@/components/shell/ContentHeader";

/** Dentro do app (canal, campanha ou Cenário que não existe ou que você não vê): mantém as barras. */
export default function AppNotFound() {
  return (
    <>
      <ContentHeader icon="map" title="Caminho não encontrado" />
      <ErrorScreen
        code="Erro 404"
        title="Este caminho não está no mapa"
        actions={
          <ButtonLink href="/inicio" linkAs={Link} variant="primary" icon="home">
            Voltar ao Início
          </ButtonLink>
        }
      >
        Esse canal, campanha ou Cenário não existe, foi apagado, ou você não tem acesso a ele. Se alguém te mandou o link, peça um convite.
      </ErrorScreen>
    </>
  );
}
