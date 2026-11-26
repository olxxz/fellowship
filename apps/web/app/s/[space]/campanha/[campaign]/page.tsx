import { Button } from "@fellowship/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/common/EmptyState";
import { MesaView } from "@/components/mesa/MesaView";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { campaignById, spaceById, spaces } from "@/lib/demo/data";

type Params = Promise<{ space: string; campaign: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return spaces.flatMap((s) => s.campaigns.map((c) => ({ space: s.id, campaign: c.id })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { space, campaign } = await params;
  const s = spaceById(space);
  return { title: `Mesa · ${(s && campaignById(s, campaign)?.name) ?? "Campanha"}` };
}

export default async function MesaPage({ params }: { params: Params }) {
  const { space, campaign } = await params;
  const s = spaceById(space);
  const c = s && campaignById(s, campaign);
  if (!s || !c) notFound();

  if (!c.live) {
    return (
      <>
        <ContentHeader icon="dice" title="Mesa" topic={c.name} />
        <EmptyState icon="dice" title="Nenhuma sessão agora" actions={<Button variant="mesa" icon="dice" disabled>Abrir a sessão</Button>}>
          A próxima sessão de {c.name} é {c.nextSession}. Quando o mestre abrir a sessão, os retratos de todos aparecem aqui.
        </EmptyState>
      </>
    );
  }
  return <MesaView space={s} campaign={c} />;
}
