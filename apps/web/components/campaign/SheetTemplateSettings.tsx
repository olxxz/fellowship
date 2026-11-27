"use client";

import { Button, IconButton, Modal, toast } from "@fellowship/ui";
import type { CampaignSystem, CustomSheetTemplate } from "@fellowship/db";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import settings from "@/components/account/Settings.module.sass";
import { saveTemplateAction, setCampaignTemplateAction } from "@/lib/app/campaign-actions";
import {
  DND_SECTIONS,
  HB_SECTIONS,
  SYSTEM_NAMES,
  sheetModel,
  templateKey,
  type DndConfig,
  type HbConfig,
  type SheetModel,
} from "@/lib/sheets/template";
import styles from "./Campaign.module.sass";

/**
 * Ficha da campanha (só o mestre): uma por campanha. Escolhe um sistema pronto ou um modelo seu; "Editar"
 * abre o editor a partir do modelo atual. Editar um modelo pronto salva um modelo novo, seu, com o nome que
 * você der (o D&D 5e original continua igual para todo mundo).
 */
export function SheetTemplateSettings({ spaceId, campaignId, model, mine }: { spaceId: string; campaignId: string; model: SheetModel; mine: CustomSheetTemplate[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const current = model.templateId ?? model.system;
  const options: Array<{ value: string; label: string }> = [
    { value: "homebrew", label: SYSTEM_NAMES.homebrew },
    { value: "dnd2024", label: SYSTEM_NAMES.dnd2024 },
    ...mine.map((t) => ({ value: t.id, label: `${t.name} (seu, ${t.base === "dnd2024" ? "D&D" : "homebrew"})` })),
  ];
  if (model.templateId && !mine.some((t) => t.id === model.templateId)) options.push({ value: model.templateId, label: `${model.name} (de outro mestre)` });

  function choose(value: string) {
    const tpl = mine.find((t) => t.id === value);
    start(async () => {
      const r = tpl
        ? await setCampaignTemplateAction(spaceId, campaignId, tpl.base, tpl.id)
        : value === model.templateId
          ? await setCampaignTemplateAction(spaceId, campaignId, model.system, value)
          : await setCampaignTemplateAction(spaceId, campaignId, value as CampaignSystem, null);
      if (r.error) return void toast.error(r.error);
      toast.success("Ficha da campanha trocada", "As fichas dos personagens passam a usar este modelo.");
      router.refresh();
    });
  }

  return (
    <section className={settings.section}>
      <h3 className={settings.sectionTitle}>Ficha da campanha</h3>
      <p className={settings.help}>Todos os personagens desta campanha usam a mesma ficha. Os valores já preenchidos continuam guardados se você trocar.</p>
      <div className={settings.inlineForm}>
        <select className={settings.input} value={current} disabled={pending} aria-label="Modelo de ficha" onChange={(e) => choose(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button icon="pencil" onClick={() => setEditing(true)}>
          Editar ficha
        </Button>
      </div>
      {editing && <TemplateEditor spaceId={spaceId} campaignId={campaignId} model={model} own={!!model.templateId && mine.some((t) => t.id === model.templateId)} onClose={() => setEditing(false)} />}
    </section>
  );
}

function TemplateEditor({ spaceId, campaignId, model, own, onClose }: { spaceId: string; campaignId: string; model: SheetModel; own: boolean; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState(own ? model.name : `${model.name} (editado)`);
  const [dnd, setDnd] = useState<DndConfig>(() => (model.system === "dnd2024" ? structuredClone(model.config) : sheetModel("dnd2024").config as DndConfig));
  const [hb, setHb] = useState<HbConfig>(() => (model.system === "homebrew" ? structuredClone(model.config) : sheetModel("homebrew").config as HbConfig));

  function save() {
    const config = model.system === "dnd2024" ? dnd : hb;
    start(async () => {
      const r = await saveTemplateAction(spaceId, campaignId, { id: own ? model.templateId : null, name, base: model.system, config: config as unknown as Record<string, unknown> });
      if (r.error) return void toast.error(r.error);
      toast.success(own ? "Modelo salvo" : "Modelo novo criado", "Já é a ficha desta campanha.");
      onClose();
      router.refresh();
    });
  }

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="Editar ficha" description={own ? "Você está editando o seu modelo." : `Parte de ${model.name}. Ao salvar, vira um modelo seu, com o nome abaixo.`}>
      <div className={settings.dialogSection}>
        <label className={settings.field}>
          <span className={settings.label}>Nome do modelo</span>
          <input className={settings.input} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </label>

        {model.system === "dnd2024" ? <DndEditor config={dnd} set={setDnd} /> : <HbEditor config={hb} set={setHb} />}

        <div className={settings.actions}>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" loading={pending} loadingLabel="Salvando…" onClick={save}>
            {own ? "Salvar" : "Salvar como modelo novo"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Sections<K extends string>({ labels, value, set }: { labels: Record<K, string>; value: Record<K, boolean>; set: (v: Record<K, boolean>) => void }) {
  return (
    <fieldset className={styles.templateBlock}>
      <legend className={settings.label}>Seções</legend>
      <div className={styles.templateChecks}>
        {(Object.keys(labels) as K[]).map((k) => (
          <label key={k} className={styles.templateCheck}>
            <input type="checkbox" checked={value[k]} onChange={(e) => set({ ...value, [k]: e.target.checked })} />
            {labels[k]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function DndEditor({ config, set }: { config: DndConfig; set: (c: DndConfig) => void }) {
  const keys = new Set(config.abilities.map((a) => a.key));
  return (
    <>
      <fieldset className={styles.templateBlock}>
        <legend className={settings.label}>Atributos</legend>
        {config.abilities.map((a, i) => (
          <div key={i} className={styles.templateRow}>
            <input
              className={settings.input}
              value={a.nome}
              maxLength={30}
              aria-label="Nome do atributo"
              onChange={(e) => set({ ...config, abilities: config.abilities.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) })}
            />
            <IconButton
              icon="close"
              variant="ghost"
              label={`Tirar ${a.nome}`}
              disabled={config.abilities.length <= 1}
              onClick={() => {
                const abilities = config.abilities.filter((_, j) => j !== i);
                const fallback = abilities[0]!.key;
                set({ ...config, abilities, skills: config.skills.map((s) => (s.attr === a.key ? { ...s, attr: fallback } : s)) });
              }}
            />
          </div>
        ))}
        <button
          type="button"
          className={styles.templateAdd}
          onClick={() => {
            let key = templateKey(`novo${config.abilities.length}`);
            while (keys.has(key)) key += "x";
            set({ ...config, abilities: [...config.abilities, { key, nome: "Novo atributo" }] });
          }}
        >
          + atributo
        </button>
      </fieldset>

      <fieldset className={styles.templateBlock}>
        <legend className={settings.label}>Perícias</legend>
        {config.skills.map((s, i) => (
          <div key={i} className={styles.templateRow}>
            <input className={settings.input} value={s.nome} maxLength={30} aria-label="Nome da perícia" onChange={(e) => set({ ...config, skills: config.skills.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) })} />
            <select className={settings.input} value={s.attr} aria-label={`Atributo de ${s.nome}`} onChange={(e) => set({ ...config, skills: config.skills.map((x, j) => (j === i ? { ...x, attr: e.target.value } : x)) })}>
              {config.abilities.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.nome}
                </option>
              ))}
            </select>
            <IconButton icon="close" variant="ghost" label={`Tirar ${s.nome}`} onClick={() => set({ ...config, skills: config.skills.filter((_, j) => j !== i) })} />
          </div>
        ))}
        <button
          type="button"
          className={styles.templateAdd}
          onClick={() => set({ ...config, skills: [...config.skills, { key: `p${Date.now().toString(36)}`, nome: "Nova perícia", attr: config.abilities[0]!.key }] })}
        >
          + perícia
        </button>
      </fieldset>

      <Sections labels={DND_SECTIONS} value={config.sections} set={(sections) => set({ ...config, sections })} />
    </>
  );
}

function HbEditor({ config, set }: { config: HbConfig; set: (c: HbConfig) => void }) {
  return (
    <>
      <label className={settings.field}>
        <span className={settings.label}>Fórmula dos testes</span>
        <input className={settings.input} value={config.formulaTeste} maxLength={60} onChange={(e) => set({ ...config, formulaTeste: e.target.value })} />
        <span className={settings.help}>{"{total}"} = valor + bônus · {"{nivel}"} = nível do atributo.</span>
      </label>
      {config.groups.map((g, gi) => (
        <fieldset key={gi} className={styles.templateBlock}>
          <legend className={styles.templateRow}>
            <input
              className={settings.input}
              value={g.titulo}
              maxLength={30}
              aria-label="Nome do grupo de atributos"
              onChange={(e) => set({ ...config, groups: config.groups.map((x, j) => (j === gi ? { ...x, titulo: e.target.value } : x)) })}
            />
            <IconButton icon="close" variant="ghost" label={`Tirar o grupo ${g.titulo}`} onClick={() => set({ ...config, groups: config.groups.filter((_, j) => j !== gi) })} />
          </legend>
          {g.itens.map((item, ii) => (
            <div key={ii} className={styles.templateRow}>
              <input
                className={settings.input}
                value={item}
                maxLength={30}
                aria-label="Atributo"
                onChange={(e) => set({ ...config, groups: config.groups.map((x, j) => (j === gi ? { ...x, itens: x.itens.map((y, k) => (k === ii ? e.target.value : y)) } : x)) })}
              />
              <IconButton
                icon="close"
                variant="ghost"
                label={`Tirar ${item}`}
                onClick={() => set({ ...config, groups: config.groups.map((x, j) => (j === gi ? { ...x, itens: x.itens.filter((_, k) => k !== ii) } : x)) })}
              />
            </div>
          ))}
          <button type="button" className={styles.templateAdd} onClick={() => set({ ...config, groups: config.groups.map((x, j) => (j === gi ? { ...x, itens: [...x.itens, "Novo"] } : x)) })}>
            + atributo
          </button>
        </fieldset>
      ))}
      <button type="button" className={styles.templateAdd} onClick={() => set({ ...config, groups: [...config.groups, { titulo: "Novo grupo", itens: [] }] })}>
        + grupo de atributos
      </button>
      <p className={settings.help}>Os grupos valem para personagens novos; nas fichas existentes, cada um ajusta os próprios atributos.</p>
      <Sections labels={HB_SECTIONS} value={config.sections} set={(sections) => set({ ...config, sections })} />
    </>
  );
}
