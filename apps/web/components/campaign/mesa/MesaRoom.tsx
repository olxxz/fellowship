"use client";

import { Button, IconButton, Popover, Sheet, Tabs, cx, playerColorStyle, toast } from "@fellowship/ui";
import type { Campaign, CampaignMember, CampaignSession, Channel, Character, Profile, Reaction, RollPayload, Sticker } from "@fellowship/db";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ImageUploadField } from "@/components/account/ImageUploadField";
import { ChatRoom } from "@/components/chat/room/ChatRoom";
import { DiceTray } from "@/components/mesa/DiceTray";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { CharacterSheet } from "@/components/sheet/CharacterSheet";
import type { SheetModel } from "@/lib/sheets/template";
import { endSessionAction, setSceneAction, startSessionAction } from "@/lib/app/campaign-actions";
import type { ChatAuthor, ChatMsg } from "@/lib/chat/source";
import { useVoice } from "@/lib/livekit/VoiceProvider";
import { useFlag } from "@/lib/prefs";
import { getBrowserClient } from "@/lib/supabase/client";
import { appSpaceHref } from "@/lib/routes";
import { useSpaceVoicePresence } from "@/components/account/VoicePeople";
import { DiceStage, type DiceStageHandle } from "./DiceStage";
import { MesaCards, type MesaSeat, type SeatPresence } from "./MesaCards";
import styles from "./Mesa.module.sass";
import { useMesaFeed } from "./useMesaFeed";

const MesaLiveCards = dynamic(() => import("./MesaLiveCards"), { ssr: false });

type P = Pick<Profile, "id" | "display_name" | "username" | "avatar_url" | "color" | "bio"> & { banner_url?: string | null };
type MobileTab = "mesa" | "chat" | "ficha";
type ChatData = { channel: Channel; messages: ChatMsg[]; reactions: Reaction[]; canSend: boolean; canManage: boolean };

interface Bubble {
  id: string;
  name: string;
  color: string;
  text: string;
  leaving?: boolean;
}

/**
 * A Mesa, como no protótipo: palco com os cards dos personagens (e a cena ao fundo), chat Ingame/Outgame
 * ao lado, bandeja de dados, ficha em gaveta e, para o mestre, sessão e cena. Com o chat fechado, as
 * falas do ingame aparecem em bolhas no palco e somem; as rolagens caem como dados 3D para todo mundo.
 */
export function MesaRoom(props: {
  spaceId: string;
  campaign: Campaign;
  session: CampaignSession | null;
  me: P;
  isMaster: boolean;
  canPlay: boolean;
  members: CampaignMember[];
  profiles: Record<string, P>;
  characters: Character[];
  ingame: ChatData | null;
  outgame: ChatData | null;
  voiceChannel: Channel | null;
  stickers: Sticker[];
  rollAs: Array<{ id: string; name: string }>;
  model: SheetModel;
}) {
  const { spaceId, campaign, session, me, isMaster, members, profiles, characters, ingame, outgame, voiceChannel, model } = props;
  const voice = useVoice();
  const router = useRouter();
  const [chatOpen, setChatOpen] = useFlag("mesa:chat", true);
  const [portraits, setPortraits] = useFlag("mesa:retratos", false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("mesa");
  const [chatTab, setChatTab] = useState<string>("ingame");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const mesaRef = useRef<HTMLDivElement>(null);
  const dice = useRef<DiceStageHandle>(null);
  const [leaving, startLeaving] = useTransition();

  const authors = useMemo(() => profiles as Record<string, ChatAuthor>, [profiles]);
  const myCharacters = characters.filter((c) => c.kind === "pc" && c.owner_id === me.id);
  const [sheetId, setSheetId] = useState<string | null>(() => (isMaster ? (characters[0]?.id ?? null) : (myCharacters[0]?.id ?? null)));
  const sheetCharacter = characters.find((c) => c.id === sheetId) ?? null;
  const myCharacter = myCharacters[0] ?? null;

  // Lugares na Mesa: o Narrador (mestre) e cada jogador com o primeiro personagem dele.
  const seats = useMemo<MesaSeat[]>(() => {
    const list: MesaSeat[] = [];
    const sorted = [...members].filter((m) => m.role !== "espectador").sort((a, b) => (a.role === "mestre" ? -1 : b.role === "mestre" ? 1 : 0));
    for (const m of sorted) {
      const p = profiles[m.user_id];
      const pc = characters.find((c) => c.kind === "pc" && c.owner_id === m.user_id);
      list.push({
        userId: m.user_id,
        characterName: m.role === "mestre" ? "Narrador" : (pc?.name ?? p?.display_name ?? "Jogador"),
        playerName: p?.display_name ?? "Alguém",
        color: m.role === "mestre" ? campaign.color : (pc?.color ?? p?.color ?? "#9b9ba5"),
        portraitUrl: m.role === "mestre" ? undefined : (pc?.portrait_url ?? undefined),
        playerAvatarUrl: p?.avatar_url ?? undefined,
      });
    }
    return list;
  }, [members, profiles, characters, campaign.color]);

  const inThisVoice = !!voiceChannel && voice.current?.id === voiceChannel.id;
  const live = inThisVoice && voice.status === "on" && voice.room;
  const roomPresence = useSpaceVoicePresence(spaceId, voice.enabled && !live);
  const presence = useMemo(() => {
    const map: Record<string, SeatPresence> = {};
    const people = voiceChannel ? (roomPresence[voiceChannel.id] ?? []) : [];
    for (const s of seats) {
      const p = people.find((x) => x.userId === s.userId);
      map[s.userId] = p ? { muted: p.muted, speaking: p.speaking } : { offline: true };
    }
    return map;
  }, [seats, roomPresence, voiceChannel]);

  function bubble(b: Bubble) {
    setBubbles((all) => [...all.filter((x) => x.id !== b.id), b].slice(-4));
    setTimeout(() => setBubbles((all) => all.map((x) => (x.id === b.id ? { ...x, leaving: true } : x))), 6000);
    setTimeout(() => setBubbles((all) => all.filter((x) => x.id !== b.id)), 6400);
  }

  // Falas e rolagens novas do ingame: dados 3D para todos; bolhas quando o chat não está à vista.
  const chatVisible = useRef(false);
  useEffect(() => {
    chatVisible.current = (chatOpen && chatTab === "ingame") || mobileTab === "chat";
  }, [chatOpen, chatTab, mobileTab]);
  useMesaFeed(ingame?.channel.id, (m) => {
    const author = profiles[m.author_id];
    if (m.kind === "rolagem") {
      try {
        const roll = JSON.parse(m.content) as RollPayload;
        dice.current?.show(roll, roll.character?.color ?? author?.color);
        if (!chatVisible.current) {
          const who = roll.character?.name ?? author?.display_name ?? "Alguém";
          bubble({ id: m.id, name: who, color: roll.character?.color ?? author?.color ?? campaign.color, text: `${roll.label ?? roll.formula}: ${roll.total}` });
        }
      } catch {
        // rolagem oculta para quem não pode ver: o servidor nem manda
      }
      return;
    }
    if (chatVisible.current || m.kind !== "texto" || !m.content) return;
    bubble({ id: m.id, name: author?.display_name ?? "Alguém", color: author?.color ?? campaign.color, text: m.content.length > 180 ? `${m.content.slice(0, 180)}…` : m.content });
  });


  async function postRoll(formula: string, hidden: boolean, label?: string) {
    if (!ingame) return;
    const res = await fetch("/api/rolar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId: ingame.channel.id, formula, label, hidden, characterId: isMaster ? undefined : myCharacter?.id }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) toast.error(data.error ?? "Não foi possível rolar.");
  }

  function openSheet() {
    if (window.matchMedia("(max-width: 767px)").matches) setMobileTab("ficha");
    else setSheetOpen(true);
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void mesaRef.current?.requestFullscreen?.();
  }

  const topic = [campaign.name, session ? `Sessão ${session.number}${session.title ? `: ${session.title}` : ""}` : null, campaign.scene_name].filter(Boolean).join(" · ");

  const sheet = sheetCharacter ? (
    <>
      {isMaster && characters.length > 1 && (
        <div className={styles.sheetChoice} role="group" aria-label="Escolher ficha">
          {characters.map((c) => (
            <Button key={c.id} variant={c.id === sheetId ? "primary" : "secondary"} onClick={() => setSheetId(c.id)}>
              {c.name}
            </Button>
          ))}
        </div>
      )}
      <CharacterSheet
        key={sheetCharacter.id}
        character={sheetCharacter}
        spaceId={spaceId}
        campaignId={campaign.id}
        meId={me.id}
        canEdit={isMaster || sheetCharacter.owner_id === me.id}
        isMaster={isMaster}
        ownerName={sheetCharacter.owner_id ? (profiles[sheetCharacter.owner_id]?.display_name ?? null) : null}
        mesaChannelId={ingame?.channel.id ?? null}
        model={model}
        compact
      />
    </>
  ) : (
    <p className={styles.emptyStage}>{isMaster ? "Nenhum personagem na campanha ainda." : "Você ainda não tem personagem. Crie o seu em Fichas."}</p>
  );

  const chatRoom = (data: ChatData, mode: "ingame" | "outgame") => (
    <ChatRoom
      key={data.channel.id}
      source={{ type: "channel", id: data.channel.id, spaceId, name: mode === "ingame" ? "Ingame" : "Outgame", topic: data.channel.topic }}
      me={me}
      authors={authors}
      initialMessages={data.messages}
      initialReactions={data.reactions}
      stickers={props.stickers}
      canSend={data.canSend}
      canManage={data.canManage}
      readOnlyReason="Quem está assistindo não escreve na mesa."
      intro={{
        title: mode === "ingame" ? "Ingame" : "Outgame",
        text: mode === "ingame" ? "Aqui falam os personagens. As rolagens da Mesa e das fichas aparecem aqui." : "Conversa entre jogadores, fora do personagem.",
      }}
      rollAs={mode === "ingame" ? props.rollAs : undefined}
    />
  );

  return (
    <>
      <ContentHeader
        icon="dice"
        title="Mesa"
        topic={topic}
        actions={
          <>
            <IconButton variant="ghost" icon="grid" label={portraits ? "Mostrar cards completos" : "Mostrar só os retratos"} aria-pressed={portraits} onClick={() => setPortraits(!portraits)} />
            <IconButton className={styles.hideMobile} variant="ghost" icon="chat" label={chatOpen ? "Esconder o chat" : "Mostrar o chat"} aria-pressed={chatOpen} onClick={() => setChatOpen(!chatOpen)} />
            <IconButton className={styles.hideMobile} variant="ghost" icon="fullscreen" label="Tela cheia" onClick={toggleFullscreen} />
          </>
        }
      />

      <div ref={mesaRef} className={cx(styles.mesa, !chatOpen && styles.noChat)} data-tab={mobileTab}>
        <div className={styles.tabs} role="group" aria-label="Ver">
          {(["mesa", "chat", "ficha"] as const).map((tab) => (
            <button key={tab} type="button" className={styles.tab} aria-pressed={mobileTab === tab} onClick={() => setMobileTab(tab)}>
              {tab === "mesa" ? "Mesa" : tab === "chat" ? "Chat" : "Ficha"}
            </button>
          ))}
        </div>

        <section className={styles.stage} aria-label="Participantes" style={playerColorStyle(campaign.color)}>
          {campaign.scene_url && <div className={styles.backdrop} style={{ ["--scene-image" as string]: `url("${campaign.scene_url}")` }} aria-hidden="true" />}
          <div className={styles.scene}>
            <div className={styles.sceneText}>
              {session ? (
                <span className={styles.sessionBadge}>
                  <span className={styles.liveDot} aria-hidden="true" />
                  Sessão {session.number} ao vivo
                </span>
              ) : (
                <span className={styles.sceneLabel}>Sem sessão aberta</span>
              )}
              <span className={styles.sceneName}>{campaign.scene_name ?? campaign.name}</span>
            </div>
            {isMaster && <MasterTools spaceId={spaceId} campaign={campaign} session={session} meId={me.id} onHiddenRoll={() => void postRoll("1d20", true, "Rolagem oculta")} />}
          </div>

          {live ? (
            <MesaLiveCards room={voice.room!} seats={seats} portraits={portraits} meId={me.id} />
          ) : (
            <MesaCards seats={seats} presence={presence} portraits={portraits} meId={me.id} />
          )}

          {voice.enabled && voiceChannel && (
            <p className={styles.voiceStatus} role="status">
              {live
                ? `Você está na voz da mesa${isMaster ? " como Narrador" : myCharacter ? ` como ${myCharacter.name}` : ""}.`
                : inThisVoice && voice.status === "connecting"
                  ? "Conectando à voz…"
                  : voice.error && inThisVoice
                    ? voice.error
                    : "Entre na voz para falar com o grupo. Quem não entrou aparece como fora da chamada."}
            </p>
          )}

          <DiceStage ref={dice} />
          {bubbles.length > 0 && (
            <ol className={styles.bubbles} aria-live="polite">
              {bubbles.map((b) => (
                <li key={b.id} className={styles.bubble} style={playerColorStyle(b.color)} data-leaving={b.leaving ? "" : undefined}>
                  <span className={styles.bubbleName}>{b.name}</span>
                  <span className={styles.bubbleText}>{b.text}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {(chatOpen || mobileTab === "chat") && (
          <aside className={styles.chat} aria-label="Chat da campanha">
            <Tabs.Root className={styles.chatTabs} value={chatTab} onValueChange={(v) => setChatTab(String(v))}>
              <Tabs.List>
                <Tabs.Tab value="ingame">Ingame</Tabs.Tab>
                <Tabs.Tab value="outgame">Outgame</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="ingame" className={styles.chatPanel}>
                {ingame ? chatRoom(ingame, "ingame") : null}
              </Tabs.Panel>
              <Tabs.Panel value="outgame" className={styles.chatPanel}>
                {outgame ? chatRoom(outgame, "outgame") : null}
              </Tabs.Panel>
            </Tabs.Root>
          </aside>
        )}

        <section className={styles.sheetTab} aria-label="Ficha">
          {mobileTab === "ficha" && sheet}
        </section>

        <div className={styles.controls} role="toolbar" aria-label="Controles da Mesa">
          {voice.enabled && voiceChannel && !inThisVoice ? (
            <Button variant="primary" icon="voice" onClick={() => voice.requestJoin({ id: voiceChannel.id, name: voiceChannel.name, spaceId })}>
              Entrar na voz
            </Button>
          ) : voice.enabled && voiceChannel ? (
            <>
              <IconButton icon={voice.muted ? "micOff" : "mic"} label={voice.muted ? "Ativar microfone" : "Mutar microfone"} aria-pressed={voice.muted} variant={voice.muted ? "danger" : "secondary"} onClick={() => voice.setMuted(!voice.muted)} />
              <IconButton icon={voice.cameraOn ? "camera" : "cameraOff"} label={voice.cameraOn ? "Desligar câmera" : "Ligar câmera"} aria-pressed={voice.cameraOn} disabled={!live} onClick={() => void voice.toggleCamera()} />
              <IconButton icon="settings" label="Voz e vídeo (microfone, saída de som, volume)" onClick={() => voice.setSettingsOpen(true)} />
            </>
          ) : null}
          {props.canPlay && ingame && (
            <Popover.Root>
              <Popover.Trigger render={<Button variant="mesa" icon="dice">Rolar dados</Button>} />
              <Popover.Popup title="Bandeja de dados">
                <DiceTray master={isMaster} note={isMaster ? "O servidor sorteia; todos veem os dados caírem na mesa." : myCharacter ? `Rola como ${myCharacter.name}.` : null} onRoll={(f, hidden) => void postRoll(f, hidden)} />
              </Popover.Popup>
            </Popover.Root>
          )}
          {!chatOpen && ingame?.canSend && <QuickWrite channelId={ingame.channel.id} spaceId={spaceId} meId={me.id} />}
          <Button className={styles.hideMobile} icon="sheet" onClick={openSheet}>
            Ficha
          </Button>
          {live ? (
            <IconButton className={styles.leave} icon="leave" label="Sair da voz" variant="danger" onClick={voice.leave} />
          ) : (
            <IconButton className={styles.leave} icon="leave" label="Sair da Mesa" variant="danger" loading={leaving} onClick={() => startLeaving(() => router.push(appSpaceHref(spaceId)))} />
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={isMaster ? "Fichas" : "Sua ficha"} description={isMaster ? "Você vê e edita todas as fichas." : undefined}>
        {sheet}
      </Sheet>
    </>
  );
}

/** Ferramentas do mestre na barra da cena: sessão, cena (nome e imagem de fundo) e rolagem oculta. */
function MasterTools({ spaceId, campaign, session, meId, onHiddenRoll }: { spaceId: string; campaign: Campaign; session: CampaignSession | null; meId: string; onHiddenRoll: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sceneName, setSceneName] = useState(campaign.scene_name ?? "");
  const [sceneUrl, setSceneUrl] = useState(campaign.scene_url ?? "");
  const [title, setTitle] = useState("");

  return (
    <div className={styles.tools} role="group" aria-label="Ferramentas do mestre">
      {session ? (
        <Button
          loading={pending}
          loadingLabel="Encerrando…"
          onClick={() =>
            start(async () => {
              const r = await endSessionAction(spaceId, campaign.id);
              if (r.error) return void toast.error(r.error);
              toast.success(`Sessão ${session.number} encerrada`);
              router.refresh();
            })
          }
        >
          Encerrar sessão
        </Button>
      ) : (
        <Popover.Root>
          <Popover.Trigger render={<Button variant="mesa" icon="dice">Abrir sessão</Button>} />
          <Popover.Popup title="Abrir sessão">
            <form
              className={styles.sceneForm}
              onSubmit={(e) => {
                e.preventDefault();
                start(async () => {
                  const r = await startSessionAction(spaceId, campaign.id, title);
                  if (r.error) return void toast.error(r.error);
                  toast.success(`Sessão ${r.number} aberta`, "Tudo o que acontecer fica guardado nela.");
                  setTitle("");
                  router.refresh();
                });
              }}
            >
              <input className={styles.sceneInput} value={title} maxLength={80} placeholder="Título (opcional)" aria-label="Título da sessão" onChange={(e) => setTitle(e.target.value)} />
              <Button type="submit" variant="primary" loading={pending} loadingLabel="Abrindo…">
                Abrir
              </Button>
            </form>
          </Popover.Popup>
        </Popover.Root>
      )}
      <Popover.Root>
        <Popover.Trigger render={<Button icon="map">Cena</Button>} />
        <Popover.Popup title="Cena atual">
          <form
            className={styles.sceneForm}
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const r = await setSceneAction(spaceId, campaign.id, sceneName, sceneUrl);
                if (r.error) return void toast.error(r.error);
                toast.success("Cena atualizada");
                router.refresh();
              });
            }}
          >
            <input className={styles.sceneInput} value={sceneName} maxLength={80} placeholder="A taverna do Corvo" aria-label="Nome da cena" onChange={(e) => setSceneName(e.target.value)} />
            <ImageUploadField
              label="Imagem de fundo"
              name="scene"
              value={sceneUrl}
              onChange={setSceneUrl}
              shape="scene"
              bucket="cenarios"
              folder={`${spaceId}/personagens/${meId}`}
              help="Mapa, paisagem ou ilustração. Aparece atrás dos cards."
              // eslint-disable-next-line @next/next/no-img-element
              preview={(url) => (url ? <img src={url} alt="" style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: "var(--radius-md)" }} /> : null)}
            />
            <Button type="submit" variant="primary" loading={pending} loadingLabel="Salvando…">
              Salvar cena
            </Button>
          </form>
        </Popover.Popup>
      </Popover.Root>
      <Button onClick={onHiddenRoll}>Rolagem oculta</Button>
    </div>
  );
}

/** Escrever no ingame sem abrir o chat: um botão que vira campo. A fala aparece em bolha no palco. */
function QuickWrite({ channelId, spaceId, meId }: { channelId: string; spaceId: string; meId: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  if (!open) return <IconButton icon="pencil" label="Escrever no ingame" onClick={() => setOpen(true)} />;
  return (
    <form
      className={styles.quickWrite}
      onSubmit={async (e) => {
        e.preventDefault();
        const content = text.trim();
        if (!content || sending) return;
        setSending(true);
        const { error } = await getBrowserClient().from("messages").insert({ space_id: spaceId, channel_id: channelId, author_id: meId, content });
        setSending(false);
        if (error) return toast.error("Não foi possível enviar.");
        setText("");
      }}
    >
      <input autoFocus value={text} maxLength={2000} placeholder="Falar no ingame" aria-label="Falar no ingame" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)} onBlur={() => !text && setOpen(false)} />
      <IconButton type="submit" icon="send" label="Enviar" variant="primary" loading={sending} />
    </form>
  );
}
