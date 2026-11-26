"use client";

import { Button, ButtonLink, Icon, playerColorStyle, type IconName, type PlayerColor } from "@fellowship/ui";
import Link from "next/link";
import { useActionState, useState } from "react";
import { appHomeHref } from "@/lib/routes";
import { createSpaceAction, type CreateSpaceState } from "./actions";
import styles from "./CreateSpaceForm.module.sass";

const COLORS: Array<{ value: PlayerColor; label: string }> = [
  { value: 1, label: "Verde-água" },
  { value: 2, label: "Coral" },
  { value: 3, label: "Lilás" },
  { value: 4, label: "Ouro" },
  { value: 5, label: "Azul" },
  { value: 6, label: "Verde" },
];

const TEMPLATES: Record<string, { name: string; text: string; categories: Array<[string, Array<[IconName, string]>]> }> = {
  padrao: {
    name: "Padrão",
    text: "Mural, conversa e uma sala de voz. Bom para começar.",
    categories: [
      ["Mural", [["announcement", "Anúncios"], ["rules", "Regras"], ["calendar", "Agenda"]]],
      ["Conversa", [["chat", "Geral"], ["gallery", "Arte e fichas"]]],
      ["Voz", [["voice", "Taverna"]]],
    ],
  },
  vazio: { name: "Só o Geral", text: "Um canal de texto. Você monta o resto depois.", categories: [["Conversa", [["chat", "Geral"]]]] },
};

const SKIP = new Set(["de", "da", "do", "das", "dos", "e", "o", "a", "os", "as", "the", "of"]);

/** Mesmas iniciais que o banco gera (create_space). */
function initials(name: string) {
  const words = name.trim().split(/\s+/).filter((w) => w && !SKIP.has(w.toLowerCase()));
  const short = words.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return short || name.trim().slice(0, 2).toUpperCase() || "?";
}

export function CreateSpaceForm() {
  const [state, action, pending] = useActionState<CreateSpaceState, FormData>(createSpaceAction, {});
  const [name, setName] = useState(state.values?.name ?? "");
  const [color, setColor] = useState<PlayerColor>((state.values?.color as PlayerColor) ?? 4);
  const [template, setTemplate] = useState(state.values?.template ?? "padrao");

  return (
    <div className={styles.layout}>
      <form className={styles.form} action={action}>
        <div>
          <h2 className={styles.title}>Criar Cenário</h2>
          <p className={styles.lead}>Um Cenário é o universo do grupo. Todas as campanhas dele acontecem no mesmo mundo.</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            Nome do Cenário
          </label>
          <input
            id="name"
            name="name"
            className={styles.input}
            required
            minLength={2}
            maxLength={60}
            placeholder="Terras de Vel"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="description">
            Descrição <span className={styles.help}>(opcional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            className={styles.textarea}
            maxLength={300}
            placeholder="Um reino de pontes e névoa, onde cada rio guarda um nome antigo."
            defaultValue={state.values?.description}
          />
        </div>

        <fieldset className={styles.field}>
          <legend className={styles.label}>Cor do Cenário</legend>
          <div className={styles.colors}>
            {COLORS.map((c) => (
              <label key={c.value} className={styles.swatch} style={playerColorStyle(c.value)} title={c.label}>
                <input type="radio" name="color" value={c.value} checked={color === c.value} onChange={() => setColor(c.value)} aria-label={c.label} />
                <span aria-hidden="true" />
              </label>
            ))}
          </div>
          <p className={styles.help}>Aparece no ícone e no banner. Você pode trocar depois.</p>
        </fieldset>

        <fieldset className={styles.field}>
          <legend className={styles.label}>Canais iniciais</legend>
          <div className={styles.templates}>
            {Object.entries(TEMPLATES).map(([id, t]) => (
              <label key={id} className={styles.template}>
                <input type="radio" name="template" value={id} checked={template === id} onChange={() => setTemplate(id)} />
                <span className={styles.templateName}>{t.name}</span>
                <span className={styles.help}>{t.text}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {state.error && (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        )}

        <div className={styles.actions}>
          <Button type="submit" variant="primary" loading={pending}>
            Criar Cenário
          </Button>
          <ButtonLink href={appHomeHref} linkAs={Link}>
            Cancelar
          </ButtonLink>
        </div>
      </form>

      <aside className={styles.preview} aria-label="Prévia">
        <p className={styles.help}>Prévia</p>
        <div className={styles.previewCard} style={playerColorStyle(color)}>
          <div className={styles.previewBanner}>
            <span className={styles.previewIcon} aria-hidden="true">
              {initials(name || "Terras de Vel")}
            </span>
            <span className={styles.previewName}>{name || "Terras de Vel"}</span>
          </div>
          <ul className={styles.previewChannels}>
            {TEMPLATES[template]!.categories.map(([category, channels]) => (
              <li key={category} style={{ display: "block" }}>
                <span className={styles.previewCategory}>{category}</span>
                <ul className={styles.previewChannels} style={{ padding: "var(--space-1) 0 0" }}>
                  {channels.map(([icon, channelName]) => (
                    <li key={channelName}>
                      <Icon name={icon} size={16} />
                      {channelName}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
