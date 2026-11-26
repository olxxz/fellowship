import { Avatar, Button, CampaignCard, ChannelCategory, ChannelRow, ChatMessage, ChatNotice, IconButton, ParticipantCard, ResourceBar, RollCard } from "@fellowship/ui";
import type { Metadata } from "next";
import styles from "./page.module.sass";

export const metadata: Metadata = { title: "Design system" };

const party = [
  { name: "Kael", color: 1 as const },
  { name: "Brom", color: 2 as const },
  { name: "Lia", color: 3 as const },
  { name: "Nyx", color: 5 as const },
];

function Showcase({ theme, name }: { theme: "dark" | "light"; name: string }) {
  return (
    <section data-theme={theme} className={styles.theme} aria-labelledby={`tema-${theme}`}>
      <h2 id={`tema-${theme}`} className={styles.themeName}>
        {name}
      </h2>

      <div className={styles.section}>
        <h3 className={styles.overline}>Button</h3>
        <div className={styles.row}>
          <Button variant="primary">Salvar alterações</Button>
          <Button>Convidar</Button>
          <Button variant="mesa" icon="dice">
            Rolar 1d20 + 4
          </Button>
          <Button variant="danger" icon="leave">
            Sair
          </Button>
          <Button disabled>Desabilitado</Button>
          <Button variant="primary" loading loadingLabel="Salvando…">
            Salvar alterações
          </Button>
          <Button variant="mesa" icon="dice" loading>
            Rolar 1d20 + 4
          </Button>
          <IconButton icon="send" label="Enviando" loading />
          <IconButton icon="mic" label="Mutar" />
          <IconButton icon="micOff" label="Desmutar" variant="danger" />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.overline}>ChannelRow e CampaignCard</h3>
        <div className={styles.sidebar}>
          <ChannelCategory name="Mural">
            <ChannelRow icon="announcement" name="Anúncios" unread />
            <ChannelRow icon="rules" name="Regras" />
            <ChannelRow icon="calendar" name="Agenda" meta="qui 20h" metaTone="mesa" />
          </ChannelCategory>
          <ChannelCategory name="Conversa">
            <ChannelRow icon="chat" name="Geral" active />
            <ChannelRow icon="gallery" name="Arte e fichas" />
            <ChannelRow icon="voice" name="Taverna" meta="2 na sala" />
          </ChannelCategory>
          <ChannelCategory name="Campanhas">
            <CampaignCard name="A Maldição de Vel" live={{ session: 12, participants: party }} />
            <CampaignCard name="Ecos de Karn" icon="map" color={1} nextSession="sáb 15h" />
          </ChannelCategory>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.overline}>ParticipantCard</h3>
        <div className={styles.participants}>
          <ParticipantCard characterName="Kael" playerName="Ana" color={1} speaking />
          <ParticipantCard characterName="Brom" playerName="Bruno" color={2} />
          <ParticipantCard characterName="Lia" playerName="Carla" color={3} muted />
          <ParticipantCard characterName="Narrador" playerName="Rafa" />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.overline}>ParticipantCard só com o retrato</h3>
        <div className={styles.portraits}>
          <ParticipantCard variant="portrait" characterName="Kael" playerName="Ana" color={1} speaking />
          <ParticipantCard variant="portrait" characterName="Brom" playerName="Bruno" color={2} />
          <ParticipantCard variant="portrait" characterName="Lia" playerName="Carla" color={3} muted />
          <ParticipantCard variant="portrait" characterName="Narrador" playerName="Rafa" />
          <ParticipantCard.Skeleton variant="portrait" />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.overline}>RollCard no chat ingame</h3>
        <div className={styles.chat}>
          <RollCard roller="Brom" label="Atletismo" formula="1d20 + 4" dice={[{ value: 15 }]} modifier={4} total={19} color={2} />
          <RollCard
            roller="Kael"
            label="Furtividade com vantagem"
            formula="2d20kh1 + 6"
            dice={[{ value: 20 }, { value: 8, discarded: true }]}
            modifier={6}
            total={26}
            color={1}
            critical={{ kind: "success", label: "20 natural" }}
          />
          <RollCard roller="Narrador" formula="1d20 + 2" dice={[{ value: 11 }]} modifier={2} total={13} hidden />
          <RollCard roller="Narrador" formula="1d20 + 2" dice={[{ value: 11 }]} modifier={2} total={13} hidden viewerIsMaster color={4} />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.overline}>ChatMessage: ingame e outgame</h3>
        <div className={styles.chat} style={{ padding: "var(--space-2) 0" }}>
          <ChatNotice tone="mesa" icon="dice">
            Sessão 12 · Cena 1: A ponte de Vel
          </ChatNotice>
          <ChatMessage scope="ingame" author={{ name: "Narrador", color: 4 }} subtitle="mestre" time="20:03" kind="narration">
            <p>A névoa sobe do rio e engole metade da ponte.</p>
          </ChatMessage>
          <ChatMessage scope="ingame" author={{ name: "Kael", color: 1 }} subtitle="Ana" time="20:04">
            <p>Ninguém atravessa ainda.</p>
          </ChatMessage>
          <ChatMessage scope="ingame" author={{ name: "Kael", color: 1 }} time="20:04" continuation>
            <p>Tem alguma coisa errada com essa luz.</p>
          </ChatMessage>
        </div>
        <div style={{ padding: "var(--space-2) 0" }}>
          <ChatMessage scope="outgame" author={{ name: "Dani", color: 5 }} time="20:01">
            <p>Gente, desculpa o atraso, a internet caiu.</p>
          </ChatMessage>
          <ChatMessage scope="outgame" author={{ name: "Ana", color: 1 }} time="agora" pending>
            <p>Mensagem enviando (envio otimista).</p>
          </ChatMessage>
          <ChatMessage scope="ingame" author={{ name: "Nyx", color: 5 }} subtitle="Dani" time="20:09" whisperTo="Narrador">
            <p>A Nyx quer pegar a lanterna sem ninguém ver.</p>
          </ChatMessage>
          <ChatMessage.Skeleton seed={1} />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.overline}>Avatar e ResourceBar</h3>
        <div className={styles.row} style={{ alignItems: "center" }}>
          <Avatar name="Ana" color={1} status="em-sessao" />
          <Avatar name="Edu" color={6} status="online" />
          <Avatar name="Fê" color={3} status="ausente" />
          <Avatar name="Gabi" color={2} status="offline" />
          <Avatar name="Kael" color={1} appearance="ring" />
          <Avatar name="Visitante" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", maxWidth: 360 }}>
          <ResourceBar label="Vida" tone="hp" value={14} max={18} />
          <ResourceBar label="Mana" tone="mana" value={6} max={8} />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.overline}>Carregando</h3>
        <div className={styles.skeletons}>
          <ChannelRow.Skeleton />
          <ChannelRow.Skeleton width="40%" />
          <CampaignCard.Skeleton />
          <RollCard.Skeleton />
          <Button.Skeleton />
        </div>
      </div>
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Design system</h1>
        <p className={styles.lead}>
          Os componentes de <code>@fellowship/ui</code> nos dois temas. Fonte da verdade dos tokens: <code>packages/ui/tokens/tokens.json</code>.
        </p>
      </header>
      <div className={styles.themes}>
        <Showcase theme="dark" name="Escuro" />
        <Showcase theme="light" name="Claro" />
      </div>
    </main>
  );
}
