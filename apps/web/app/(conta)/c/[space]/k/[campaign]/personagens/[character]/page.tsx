import { notFound } from "next/navigation";
import styles from "@/components/campaign/Campaign.module.sass";
import { CharacterSheet } from "@/components/sheet/CharacterSheet";
import { loadCampaign } from "@/lib/app/campaign-context";

export default async function CharacterPage({ params }: { params: Promise<{ space: string; campaign: string; character: string }> }) {
  const { space, campaign, character: id } = await params;
  const c = await loadCampaign(space, campaign, `/c/${space}/k/${campaign}/personagens/${id}`);
  const character = c.characters.find((ch) => ch.id === id);
  if (!character) notFound();
  const mesa = c.channels.find((ch) => ch.kind === "texto");
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <CharacterSheet
          key={character.id}
          character={character}
          spaceId={space}
          campaignId={campaign}
          meId={c.profile.id}
          canEdit={c.isMaster || character.owner_id === c.profile.id}
          isMaster={c.isMaster}
          ownerName={character.owner_id ? (c.profiles[character.owner_id]?.display_name ?? null) : null}
          mesaChannelId={mesa?.id ?? null}
        />
      </div>
    </main>
  );
}
