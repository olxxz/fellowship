"use client";

import { Button, ColorPicker, toast } from "@fellowship/ui";
import type { Campaign, CustomSheetTemplate } from "@fellowship/db";
import type { SheetModel } from "@/lib/sheets/template";
import { SheetTemplateSettings } from "./SheetTemplateSettings";
import { useState, useTransition } from "react";
import { ImageUploadField } from "@/components/account/ImageUploadField";
import settings from "@/components/account/Settings.module.sass";
import { deleteCampaignAction, updateCampaignAction } from "@/lib/app/campaign-actions";
import styles from "./Campaign.module.sass";

/** Ajustes da campanha (só o mestre): nome, descrição, cor, banner, aberta ou fechada, ficha da campanha, apagar. */
export function CampaignSettings({ spaceId, campaign, model, myTemplates }: { spaceId: string; campaign: Campaign; model: SheetModel; myTemplates: CustomSheetTemplate[] }) {
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description ?? "");
  const [color, setColor] = useState(campaign.color);
  const [banner, setBanner] = useState(campaign.banner_url ?? "");
  const [open, setOpen] = useState(campaign.open_to_join);
  const [typed, setTyped] = useState("");
  const [pending, start] = useTransition();

  return (
    <main className={styles.page}>
      <div className={styles.inner} style={{ maxWidth: 680 }}>
        <form
          className={settings.form}
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await updateCampaignAction(spaceId, campaign.id, { name, description, color, system: campaign.system, open, bannerUrl: banner });
              if (r.error) toast.error(r.error);
              else toast.success("Campanha salva");
            });
          }}
        >
          <label className={settings.field}>
            <span className={settings.label}>Nome</span>
            <input className={settings.input} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className={settings.field}>
            <span className={settings.label}>Descrição</span>
            <textarea className={settings.textarea} value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <ImageUploadField
            label="Banner"
            name="banner_url"
            value={banner}
            onChange={setBanner}
            shape="banner"
            bucket="cenarios"
            folder={spaceId}
            help="Fundo do cabeçalho da campanha."
            preview={(url) => <div className={settings.bannerPreview} style={{ ["--player-color" as string]: color, ...(url ? { backgroundImage: `url("${url}")` } : {}) }} />}
          />
          <ColorPicker label="Cor" value={color} onChange={setColor} />
          <label className={settings.switchRow}>
            <input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} />
            <span className={settings.field}>
              <span className={settings.label}>Aberta</span>
              <span className={settings.help}>Qualquer membro do Cenário entra como jogador sem pedir.</span>
            </span>
          </label>
          <div className={settings.actions}>
            <Button type="submit" variant="primary" loading={pending} loadingLabel="Salvando…">
              Salvar
            </Button>
          </div>
        </form>
        <SheetTemplateSettings spaceId={spaceId} campaignId={campaign.id} model={model} mine={myTemplates} />
        <section className={settings.section}>
          <h3 className={settings.sectionTitle}>Apagar campanha</h3>
          <p className={settings.help}>Apaga canais, mensagens e fichas da campanha. Não tem volta.</p>
          <div className={settings.inlineForm}>
            <input className={settings.input} value={typed} placeholder={`Digite ${campaign.name}`} aria-label="Confirme o nome da campanha" onChange={(e) => setTyped(e.target.value)} />
            <Button
              variant="danger"
              icon="trash"
              disabled={typed.trim() !== campaign.name || pending}
              onClick={() =>
                start(async () => {
                  const r = await deleteCampaignAction(spaceId, campaign.id);
                  if (r?.error) toast.error(r.error);
                })
              }
            >
              Apagar para sempre
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
