"use client";

import { Button, ColorPicker, Icon, toast } from "@fellowship/ui";
import type { Character } from "@fellowship/db";
import { useEffect, useRef, useState, useTransition } from "react";
import { ImageUploadField } from "@/components/account/ImageUploadField";
import { deleteCharacterAction } from "@/lib/app/campaign-actions";
import { normalizeDnd, type DndSheet } from "@/lib/sheets/dnd";
import { normalizeHomebrew, type HomebrewSheet } from "@/lib/sheets/homebrew";
import { importHomebrewMarkdown } from "@/lib/sheets/import-md";
import { getBrowserClient } from "@/lib/supabase/client";
import { sheetModel, type SheetModel } from "@/lib/sheets/template";
import { DndSheetView } from "./DndSheetView";
import { HomebrewSheetView } from "./HomebrewSheetView";
import styles from "./CharacterSheet.module.sass";

type Save = "salvo" | "salvando" | "erro";

/**
 * Ficha de um personagem: cabeçalho (retrato, nome, cor) e a ficha do modelo da campanha.
 * Salva sozinha (um instante depois de parar de mexer). Quem não é dono nem mestre só lê.
 */
export function CharacterSheet({
  character,
  spaceId,
  campaignId,
  meId,
  canEdit,
  isMaster,
  ownerName,
  mesaChannelId,
  model = sheetModel(character.template),
  compact,
}: {
  character: Character;
  spaceId: string;
  campaignId: string;
  meId: string;
  canEdit: boolean;
  isMaster: boolean;
  ownerName: string | null;
  mesaChannelId: string | null;
  /** Modelo de ficha da campanha (escolhido pelo mestre): manda em qual ficha aparece. */
  model?: SheetModel;
  /** Na gaveta da Mesa: sem cor e sem apagar. */
  compact?: boolean;
}) {
  const [name, setName] = useState(character.name);
  const [color, setColor] = useState(character.color);
  const [portrait, setPortrait] = useState(character.portrait_url ?? "");
  const [revealed, setRevealed] = useState(character.revealed);
  const [sheet, setSheet] = useState<HomebrewSheet | DndSheet>(() => (model.system === "dnd2024" ? normalizeDnd(character.sheet) : normalizeHomebrew(character.sheet)));
  const [save, setSave] = useState<Save>("salvo");
  const [deleting, startDelete] = useTransition();
  const first = useRef(true);
  const fileRef = useRef<HTMLInputElement>(null);

  // Salvamento automático, 700 ms depois da última mudança.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!canEdit) return;
    const t = setTimeout(async () => {
      setSave("salvando");
      const { error } = await getBrowserClient()
        .from("characters")
        .update({ name: name.trim() || "Sem nome", color, portrait_url: portrait || null, template: model.system, sheet, ...(isMaster ? { revealed } : {}) })
        .eq("id", character.id);
      if (error) {
        setSave("erro");
        toast.error("Não foi possível salvar a ficha", "Confira a conexão; as mudanças continuam aqui.");
      } else setSave("salvo");
    }, 700);
    return () => clearTimeout(t);
  }, [name, color, portrait, sheet, revealed, canEdit, isMaster, character.id, model.system]);

  async function roll(formula: string, label: string) {
    if (!mesaChannelId) return toast.error("Esta campanha não tem um canal de mesa para rolar.");
    const res = await fetch("/api/rolar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelId: mesaChannelId, formula, label, characterId: character.id }) });
    const data = (await res.json().catch(() => ({}))) as { message?: { content: string }; error?: string };
    if (!res.ok || !data.message) return toast.error(data.error ?? "Não foi possível rolar.");
    const total = (JSON.parse(data.message.content) as { total: number }).total;
    toast.success(`${label}: ${total}`, "Rolado na mesa");
  }

  async function importMd(file: File | undefined) {
    if (!file) return;
    const { name: n, sheet: s } = importHomebrewMarkdown(await file.text());
    setName(n);
    setSheet(s);
    toast.success("Ficha importada", "Confira os campos; a ficha já está salvando.");
    if (fileRef.current) fileRef.current.value = "";
  }

  const canRoll = canEdit && !!mesaChannelId;

  return (
    <div className={styles.wrap} style={{ ["--player-color" as string]: color }}>
      <header className={styles.head}>
        <div className={styles.portrait}>
          {canEdit ? (
            <ImageUploadField
              label="Retrato"
              name="portrait_url"
              value={portrait}
              onChange={setPortrait}
              shape="square"
              bucket="cenarios"
              folder={`${spaceId}/personagens/${meId}`}
              preview={(url) => <span className={styles.portraitImg} style={url ? { backgroundImage: `url("${url}")` } : undefined}>{!url && (name.charAt(0).toUpperCase() || "?")}</span>}
            />
          ) : (
            <span className={styles.portraitImg} style={portrait ? { backgroundImage: `url("${portrait}")` } : undefined}>
              {!portrait && (name.charAt(0).toUpperCase() || "?")}
            </span>
          )}
        </div>
        <div className={styles.identity}>
          <input className={styles.name} value={name} readOnly={!canEdit} maxLength={80} aria-label="Nome do personagem" onChange={(e) => setName(e.target.value)} />
          <p className={styles.meta}>
            {character.kind === "npc" ? "NPC do mestre" : ownerName ? `Jogado por ${ownerName}` : "Personagem"} · {model.name}
            {canEdit && <span className={styles.save}> · {save === "salvo" ? "Salvo" : save === "erro" ? "Erro ao salvar" : "Salvando…"}</span>}
          </p>
          {canEdit && (
            <div className={styles.actions}>
              {model.system === "homebrew" && (
                <>
                  <Button icon="sheet" variant="ghost" onClick={() => fileRef.current?.click()}>
                    Importar .md
                  </Button>
                  <input ref={fileRef} type="file" accept=".md,text/markdown,text/plain" hidden onChange={(e) => void importMd(e.target.files?.[0])} />
                </>
              )}
              {isMaster && character.kind === "npc" && (
                <label className={styles.reveal}>
                  <input type="checkbox" checked={revealed} onChange={(e) => setRevealed(e.target.checked)} />
                  <Icon name="eye" size={16} /> Visível para os jogadores
                </label>
              )}
              {!compact && (
              <Button
                variant="ghost"
                icon="trash"
                loading={deleting}
                onClick={() => {
                  if (!confirm(`Apagar ${name}? A ficha some de vez.`)) return;
                  startDelete(async () => {
                    const r = await deleteCharacterAction(spaceId, campaignId, character.id);
                    if (r?.error) toast.error(r.error);
                  });
                }}
              >
                Apagar
              </Button>
              )}
            </div>
          )}
        </div>
      </header>
      {canEdit && !compact && (
        <details className={styles.colorBox}>
          <summary>Cor do personagem</summary>
          <ColorPicker label="Cor" value={color} onChange={setColor} help="Pinta o nome, o retrato e as rolagens dele." />
        </details>
      )}
      {model.system === "dnd2024" ? (
        <DndSheetView sheet={sheet as DndSheet} set={setSheet} readOnly={!canEdit} roll={canRoll ? (f, l) => void roll(f, l) : undefined} config={model.config} />
      ) : (
        <HomebrewSheetView sheet={sheet as HomebrewSheet} set={setSheet} readOnly={!canEdit} roll={canRoll ? (f, l) => void roll(f, l) : undefined} config={model.config} />
      )}
    </div>
  );
}
