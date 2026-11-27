"use client";

import { Button, ColorPicker, Modal, toast } from "@fellowship/ui";
import type { CampaignSystem } from "@fellowship/db";
import { useState, useTransition } from "react";
import { createCampaignAction } from "@/lib/app/campaign-actions";
import styles from "./Settings.module.sass";

const SYSTEMS: Array<{ id: CampaignSystem; label: string; help: string }> = [
  { id: "homebrew", label: "Homebrew do grupo", help: "Atributos, HP/SP, habilidades com nível, perícias, vantagens, corpo, mochila e K/D." },
  { id: "dnd2024", label: "D&D 5e (2024)", help: "Atributos, perícias, salvaguardas, CA, PV, ataques, magias e equipamento." },
];

/** Criar campanha: quem cria vira mestre; já nascem a mesa, o fora-de-jogo e a voz da mesa. */
export function CreateCampaignDialog({ spaceId, open, onOpenChange }: { spaceId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#d4a24c");
  const [system, setSystem] = useState<CampaignSystem>("homebrew");
  const [pending, start] = useTransition();

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Criar campanha" description="Você vira o mestre. Depois chame os jogadores na aba Membros da campanha.">
      <form
        className={styles.dialogSection}
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return toast.error("Dê um nome à campanha.");
          start(async () => {
            const r = await createCampaignAction({ spaceId, name, description, color, system });
            if (r?.error) toast.error(r.error);
            else onOpenChange(false);
          });
        }}
      >
        <label className={styles.field}>
          <span className={styles.label}>Nome</span>
          <input className={styles.input} value={name} maxLength={60} autoFocus placeholder="A Maldição de Vel" onChange={(e) => setName(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>
            Descrição <span className={styles.help}>(opcional)</span>
          </span>
          <textarea className={styles.textarea} value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <fieldset className={styles.kinds}>
          <legend className={styles.label} style={{ marginBottom: "var(--space-2)" }}>
            Ficha
          </legend>
          {SYSTEMS.map((s) => (
            <label key={s.id} className={styles.kind}>
              <input type="radio" name="system" checked={system === s.id} onChange={() => setSystem(s.id)} />
              <span className={styles.kindText}>
                <strong>{s.label}</strong>
                <span className={styles.help}>{s.help}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <ColorPicker label="Cor" value={color} onChange={setColor} />
        <div className={styles.actions}>
          <Button type="submit" variant="primary" icon="dice" loading={pending} loadingLabel="Criando…">
            Criar campanha
          </Button>
        </div>
      </form>
    </Modal>
  );
}
