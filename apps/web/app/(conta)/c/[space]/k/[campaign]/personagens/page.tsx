import { CharacterList } from "@/components/campaign/CharacterList";
import { loadCampaign } from "@/lib/app/campaign-context";

export default async function CharactersPage({ params }: { params: Promise<{ space: string; campaign: string }> }) {
  const { space, campaign } = await params;
  const c = await loadCampaign(space, campaign, `/c/${space}/k/${campaign}/personagens`);
  return (
    <CharacterList
      spaceId={space}
      campaign={c.campaign}
      characters={c.characters}
      owners={Object.fromEntries(Object.entries(c.profiles).map(([id, p]) => [id, p.display_name]))}
      isMaster={c.isMaster}
      canCreate={c.myRole === "mestre" || c.myRole === "jogador"}
      meId={c.profile.id}
    />
  );
}
