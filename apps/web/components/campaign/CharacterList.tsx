"use client";

import { Button, Modal, playerColorStyle, toast } from "@fellowship/ui";
import type { Campaign, Character, SheetTemplate } from "@fellowship/db";
import Link from "next/link";
import { useState, useTransition } from "react";
import settings from "@/components/account/Settings.module.sass";
import { createCharacterAction } from "@/lib/app/campaign-actions";
import { emptyDnd } from "@/lib/sheets/dnd";
import { emptyHomebrew } from "@/lib/sheets/homebrew";
import { importHomebrewMarkdown } from "@/lib/sheets/import-md";
import { characterHref } from "@/lib/routes";
import styles from "./Campaign.module.sass";

/** Personagens da campanha (os jogadores veem os PJs e os NPCs revelados; o mestre vê todos). */
export function CharacterList({
  spaceId,
  campaign,
  characters,
  owners,
  isMaster,
  canCreate,
  meId,
}: {
  spaceId: string;
  campaign: Campaign;
  characters: Character[];
  owners: Record<string, string>;
  isMaster: boolean;
  canCreate: boolean;
  meId: string;
}) {
  const [open, setOpen] = useState(false);
  const pcs = characters.filter((c) => c.kind === "pc");
  const npcs = characters.filter((c) => c.kind === "npc");

  const card = (c: Character) => (
    <li key={c.id}>
      <Link href={characterHref(spaceId, campaign.id, c.id)} className={styles.card} style={playerColorStyle(c.color)}>
        <span className={styles.portrait} style={c.portrait_url ? { backgroundImage: `url("${c.portrait_url}")` } : undefined}>
          {!c.portrait_url && c.name.charAt(0).toUpperCase()}
        </span>
        <span className={styles.cardBody}>
          <span className={styles.cardName}>{c.name}</span>
          <span className={styles.cardSub}>
            {c.kind === "npc" ? "NPC" : c.owner_id === meId ? "Seu personagem" : (owners[c.owner_id ?? ""] ?? "Jogador")}
            {sheetSummary(c)}
          </span>
          {c.kind === "npc" && !c.revealed && <span className={styles.badge}>Escondido dos jogadores</span>}
        </span>
      </Link>
    </li>
  );

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.toolbar}>
          <h2 className={styles.sectionTitle}>Personagens</h2>
          {canCreate && (
            <Button variant="primary" icon="plus" onClick={() => setOpen(true)}>
              Novo personagem
            </Button>
          )}
        </div>
        {pcs.length === 0 ? <p className={settings.help}>Ninguém criou personagem ainda.</p> : <ul className={styles.grid}>{pcs.map(card)}</ul>}
        {(npcs.length > 0 || isMaster) && (
          <>
            <h2 className={styles.sectionTitle}>NPCs</h2>
            {npcs.length === 0 ? <p className={settings.help}>Crie NPCs para a mesa; eles ficam escondidos até você revelar.</p> : <ul className={styles.grid}>{npcs.map(card)}</ul>}
          </>
        )}
      </div>
      {open && <NewCharacter spaceId={spaceId} campaign={campaign} isMaster={isMaster} onClose={() => setOpen(false)} />}
    </main>
  );
}

function sheetSummary(c: Character) {
  const s = c.sheet as { classe?: string; nivel?: number };
  const parts = [s.classe, s.nivel ? `nível ${s.nivel}` : ""].filter(Boolean);
  return parts.length ? ` · ${parts.join(", ")}` : "";
}

function NewCharacter({ spaceId, campaign, isMaster, onClose }: { spaceId: string; campaign: Campaign; isMaster: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<SheetTemplate>(campaign.system);
  const [kind, setKind] = useState<"pc" | "npc">("pc");
  const [revealed, setRevealed] = useState(false);
  const [imported, setImported] = useState<{ name: string; sheet: Record<string, unknown> } | null>(null);
  const [pending, start] = useTransition();

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="Novo personagem">
      <form
        className={settings.dialogSection}
        onSubmit={(e) => {
          e.preventDefault();
          const finalName = name.trim() || imported?.name || "";
          if (!finalName) return toast.error("Dê um nome ao personagem.");
          const sheet = imported?.sheet ?? (template === "dnd2024" ? emptyDnd() : emptyHomebrew());
          start(async () => {
            const r = await createCharacterAction(spaceId, campaign.id, { name: finalName, template: imported ? "homebrew" : template, kind, revealed, sheet: sheet as unknown as Record<string, unknown> });
            if (r?.error) toast.error(r.error);
          });
        }}
      >
        <label className={settings.field}>
          <span className={settings.label}>Nome</span>
          <input className={settings.input} value={name} maxLength={80} autoFocus placeholder={imported?.name ?? "Bjørn Edgardson"} onChange={(e) => setName(e.target.value)} />
        </label>
        <fieldset className={settings.kinds}>
          <legend className={settings.label} style={{ marginBottom: "var(--space-2)" }}>
            Ficha
          </legend>
          {(
            [
              ["homebrew", "Homebrew do grupo"],
              ["dnd2024", "D&D 5e (2024)"],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className={settings.kind}>
              <input type="radio" name="template" checked={template === id} disabled={!!imported} onChange={() => setTemplate(id)} />
              <span className={settings.kindText}>
                <strong>{label}</strong>
                {id === campaign.system && <span className={settings.help}>Padrão da campanha</span>}
              </span>
            </label>
          ))}
        </fieldset>
        <label className={settings.field}>
          <span className={settings.label}>Importar ficha do Obsidian (.md, homebrew)</span>
          <input
            type="file"
            accept=".md,text/markdown,text/plain"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return setImported(null);
              const r = importHomebrewMarkdown(await f.text());
              setImported({ name: r.name, sheet: r.sheet as unknown as Record<string, unknown> });
              setTemplate("homebrew");
              toast.success(`Ficha de ${r.name} lida`);
            }}
          />
        </label>
        {isMaster && (
          <>
            <label className={settings.switchRow}>
              <input type="checkbox" checked={kind === "npc"} onChange={(e) => setKind(e.target.checked ? "npc" : "pc")} />
              <span className={settings.field}>
                <span className={settings.label}>É um NPC</span>
                <span className={settings.help}>Do mestre, sem jogador.</span>
              </span>
            </label>
            {kind === "npc" && (
              <label className={settings.switchRow}>
                <input type="checkbox" checked={revealed} onChange={(e) => setRevealed(e.target.checked)} />
                <span className={settings.field}>
                  <span className={settings.label}>Visível para os jogadores</span>
                  <span className={settings.help}>Desligado, só você vê até revelar.</span>
                </span>
              </label>
            )}
          </>
        )}
        <div className={settings.actions}>
          <Button type="submit" variant="primary" icon="plus" loading={pending} loadingLabel="Criando…">
            Criar e abrir a ficha
          </Button>
        </div>
      </form>
    </Modal>
  );
}
