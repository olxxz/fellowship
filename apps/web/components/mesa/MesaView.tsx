"use client";

import { Button, IconButton, Menu, ParticipantCard, Popover, Sheet, Tabs, cx } from "@fellowship/ui";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChatView } from "@/components/chat/ChatView";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { characterById, userById, type DemoCampaign, type DemoCharacter, type DemoSpace } from "@/lib/demo/data";
import { rollFormula } from "@/lib/demo/dice";
import { useDemo } from "@/lib/demo/store";
import { useFlag } from "@/lib/prefs";
import { spaceHref } from "@/lib/routes";
import { CharacterSheet } from "./CharacterSheet";
import { DiceTray } from "./DiceTray";
import styles from "./MesaView.module.sass";

type MobileTab = "mesa" | "chat" | "ficha";

const testRequests = [
  { skill: "Percepção", target: "todos" },
  { skill: "Atletismo", target: "Brom" },
  { skill: "Ocultismo", target: "Lia" },
  { skill: "Furtividade", target: "Nyx" },
];

/** A Mesa: palco com os participantes, chat da campanha ao lado, ficha em gaveta e bandeja de dados. */
export function MesaView({ space, campaign }: { space: DemoSpace; campaign: DemoCampaign }) {
  const { send, viewer, me, myCharacter } = useDemo();
  const master = viewer === "mestre";
  const ingameKey = `${space.id}/${campaign.id}/ingame`;
  const outgameKey = `${space.id}/${campaign.id}/outgame`;

  const [muted, setMuted] = useFlag("mutado", false);
  const [chatOpen, setChatOpen] = useFlag("mesa:chat", true);
  const [portraits, setPortraits] = useFlag("mesa:retratos", false);
  const [simulate, setSimulate] = useFlag("mesa:simular-fala", true);
  const [speakingId, setSpeakingId] = useState<string | null>("brom");
  const [sceneIndex, setSceneIndex] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>("mesa");
  const [chatTab, setChatTab] = useState<string>("ingame");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetCharacterId, setSheetCharacterId] = useState<string>(campaign.characterIds[0]!);
  const mesaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const narrator = characterById("narrador")!;
  const party = campaign.characterIds.map((id) => characterById(id)!);
  const participants = [...party, narrator];
  const myCardId = master ? "narrador" : myCharacter.id;
  const sheetCharacter = master ? characterById(sheetCharacterId)! : myCharacter;

  // Simulação de quem fala (no app de verdade, vem da detecção de voz do LiveKit).
  useEffect(() => {
    if (!simulate) return;
    const ids = [...campaign.characterIds, "narrador"];
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      const pool = [...ids.filter((id) => !(muted && id === myCardId)), null];
      setSpeakingId(pool[Math.floor(Math.random() * pool.length)] ?? null);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [simulate, muted, myCardId, campaign.characterIds]);

  function postRoll(formula: string, hidden: boolean, character: DemoCharacter = master ? narrator : myCharacter, label?: string) {
    const result = rollFormula(formula);
    if (!result) return;
    send(ingameKey, { type: "roll", authorId: master ? "rafa" : me.id, characterId: character.id, label, hidden, ...result });
    setChatTab("ingame");
  }

  function openSheet() {
    if (window.matchMedia("(max-width: 767px)").matches) setMobileTab("ficha");
    else setSheetOpen(true);
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void mesaRef.current?.requestFullscreen?.();
  }

  const scene = campaign.scenes[sceneIndex % campaign.scenes.length]!;

  const sheet = (
    <CharacterSheet
      character={sheetCharacter}
      onRoll={(c, label, formula) => postRoll(formula, false, c, label)}
      choices={master ? party : undefined}
      onChoose={setSheetCharacterId}
    />
  );

  return (
    <>
      <ContentHeader
        icon="dice"
        title="Mesa"
        topic={`${campaign.name} · Sessão ${campaign.live?.session} · Cena ${sceneIndex + 1}: ${scene}`}
        actions={
          <>
            <IconButton
              icon="grid"
              label={portraits ? "Mostrar cards completos" : "Mostrar só os retratos"}
              aria-pressed={portraits}
              onClick={() => setPortraits(!portraits)}
            />
            <IconButton className={styles.hideMobile} icon="chat" label={chatOpen ? "Esconder o chat" : "Mostrar o chat"} aria-pressed={chatOpen} onClick={() => setChatOpen(!chatOpen)} />
            <IconButton className={styles.hideMobile} icon="fullscreen" label="Tela cheia" onClick={toggleFullscreen} />
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

        <section className={styles.stage} aria-label="Participantes">
          <div className={styles.scene}>
            <div className={styles.sceneText}>
              <span className={styles.sceneLabel}>Cena {sceneIndex + 1}</span>
              <span className={styles.sceneName}>{scene}</span>
            </div>
            {master && (
              <div className={styles.tools} role="group" aria-label="Ferramentas do mestre">
                <Menu.Root>
                  <Menu.Trigger render={<Button variant="mesa" icon="eye">Pedir teste</Button>} />
                  <Menu.Popup>
                    {testRequests.map((t) => (
                      <Menu.Item
                        key={t.skill}
                        onClick={() => {
                          send(ingameKey, { type: "notice", tone: "mesa", icon: "eye", text: `O mestre pediu um teste de ${t.skill} para ${t.target}` });
                          setChatTab("ingame");
                        }}
                      >
                        {t.skill} · {t.target}
                      </Menu.Item>
                    ))}
                  </Menu.Popup>
                </Menu.Root>
                <Button onClick={() => postRoll("1d20", true)}>Rolagem oculta</Button>
                <Button
                  onClick={() => {
                    const next = sceneIndex + 1;
                    setSceneIndex(next);
                    send(ingameKey, { type: "notice", tone: "mesa", icon: "dice", text: `Cena ${next + 1}: ${campaign.scenes[next % campaign.scenes.length]}` });
                  }}
                >
                  Próxima cena
                </Button>
              </div>
            )}
          </div>

          <div className={cx(styles.participants, portraits && styles.portraits)}>
            {participants.map((p) => {
              const owner = p.ownerId ? userById(p.ownerId)! : userById(campaign.masterId)!;
              const isMe = p.id === myCardId;
              return (
                <ParticipantCard
                  key={p.id}
                  variant={portraits ? "portrait" : "full"}
                  characterName={p.name}
                  playerName={isMe ? `${owner.name} (você)` : owner.name}
                  color={p.color}
                  speaking={speakingId === p.id}
                  muted={isMe && muted}
                />
              );
            })}
          </div>

          <label className={styles.simToggle}>
            <input type="checkbox" checked={simulate} onChange={(e) => setSimulate(e.target.checked)} />
            Simular quem está falando (protótipo, até o LiveKit entrar)
          </label>
        </section>

        {(chatOpen || mobileTab === "chat") && (
          <aside className={styles.chat} aria-label="Chat da campanha">
            <Tabs.Root className={styles.chatTabs} value={chatTab} onValueChange={(v) => setChatTab(String(v))}>
              <Tabs.List>
                <Tabs.Tab value="ingame">Ingame</Tabs.Tab>
                <Tabs.Tab value="outgame">Outgame</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="ingame" className={styles.chatPanel}>
                <ChatView channelKey={ingameKey} mode="ingame" name="Ingame" compact />
              </Tabs.Panel>
              <Tabs.Panel value="outgame" className={styles.chatPanel}>
                <ChatView channelKey={outgameKey} mode="outgame" name="Outgame" compact />
              </Tabs.Panel>
            </Tabs.Root>
          </aside>
        )}

        <section className={styles.sheetTab} aria-label="Ficha">
          {mobileTab === "ficha" && sheet}
        </section>

        <div className={styles.controls} role="toolbar" aria-label="Controles da Mesa">
          <IconButton icon={muted ? "micOff" : "mic"} label={muted ? "Ativar microfone" : "Mutar microfone"} aria-pressed={muted} variant={muted ? "danger" : "secondary"} onClick={() => setMuted(!muted)} />
          <IconButton icon="cameraOff" label="Câmera (chega com o LiveKit)" disabled />
          <Popover.Root>
            <Popover.Trigger render={<Button variant="mesa" icon="dice">Rolar dados</Button>} />
            <Popover.Popup title="Bandeja de dados">
              <DiceTray master={master} onRoll={(f, hidden) => postRoll(f, hidden)} />
            </Popover.Popup>
          </Popover.Root>
          <Button className={styles.hideMobile} icon="sheet" onClick={openSheet}>
            Ficha
          </Button>
          <IconButton className={styles.leave} icon="leave" label="Sair da Mesa" variant="danger" onClick={() => router.push(spaceHref(space.id, "geral"))} />
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={master ? "Fichas" : "Sua ficha"} description={master ? "Você vê e edita todas as fichas." : sheetCharacter.title}>
        {sheet}
      </Sheet>
    </>
  );
}

