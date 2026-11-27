import type { CampaignSession } from "@fellowship/db";
import { CampaignSessions } from "@/components/campaign/CampaignSessions";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { loadCampaign } from "@/lib/app/campaign-context";

type Params = Promise<{ space: string; campaign: string }>;

/** Sessões da campanha e busca no que foi dito (em qual sessão aconteceu tal coisa). */
export default async function SessionsPage({ params, searchParams }: { params: Params; searchParams: Promise<{ q?: string }> }) {
  const { space, campaign } = await params;
  const { q = "" } = await searchParams;
  const c = await loadCampaign(space, campaign, `/c/${space}/k/${campaign}/sessoes`);
  const texts = c.channels.filter((ch) => ch.kind === "texto");
  const { data: sessions } = await c.supabase.from("campaign_sessions").select("id, campaign_id, number, title, started_at, ended_at").eq("campaign_id", campaign).order("number", { ascending: false });
  const term = q.trim().slice(0, 80);
  let results: Array<{ id: string; content: string; created_at: string; author_id: string; channel_id: string; session_id: string | null }> = [];
  if (term && texts.length) {
    // % e _ viram literais: a busca é por texto, não por padrão.
    const like = `%${term.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    const { data } = await c.supabase
      .from("messages")
      .select("id, content, created_at, author_id, channel_id, session_id")
      .in("channel_id", texts.map((t) => t.id))
      .eq("kind", "texto")
      .ilike("content", like)
      .order("created_at", { ascending: false })
      .limit(60);
    results = data ?? [];
  }
  return (
    <>
      <ContentHeader icon="book" title="Sessões" topic={c.campaign.name} />
      <CampaignSessions
        spaceId={space}
        campaignId={campaign}
        sessions={(sessions ?? []) as CampaignSession[]}
        query={term}
        results={results.map((r) => ({
          ...r,
          author: c.profiles[r.author_id]?.display_name ?? "Alguém",
          channel: r.channel_id === texts[0]?.id ? "Ingame" : r.channel_id === texts[1]?.id ? "Outgame" : (texts.find((t) => t.id === r.channel_id)?.name ?? ""),
        }))}
      />
    </>
  );
}
