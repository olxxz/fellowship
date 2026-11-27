import { redirect } from "next/navigation";
import { EmptyState } from "@/components/common/EmptyState";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { isChatChannel } from "@/lib/app/channels";
import { getSpaceView, requireAccount } from "@/lib/app/queries";
import { appSpaceHref } from "@/lib/routes";

/** Abrir um Cenário leva ao primeiro canal de texto que a conta pode ver. */
export default async function SpaceIndexPage({ params }: { params: Promise<{ space: string }> }) {
  const { space: spaceId } = await params;
  const { supabase } = await requireAccount(`/c/${spaceId}`);
  const view = await getSpaceView(supabase, spaceId);
  const first = view.channels.find((c) => isChatChannel(c.kind)) ?? view.channels[0];
  if (first) redirect(appSpaceHref(spaceId, first.id));
  return (
    <>
      <ContentHeader icon="chat" title={view.space.name} />
      <EmptyState icon="chat" title="Nenhum canal visível">
        Você ainda não tem acesso a nenhum canal deste Cenário. Fale com quem administra.
      </EmptyState>
    </>
  );
}
