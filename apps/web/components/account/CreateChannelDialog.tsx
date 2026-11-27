"use client";

import { Button, Icon, Modal, type IconName, toast } from "@fellowship/ui";
import type { Category } from "@fellowship/db";
import { useState, useTransition } from "react";
import { createChannelAction, type NewChannelKind } from "@/lib/app/space-actions";
import styles from "./Settings.module.sass";

const KINDS: Array<{ kind: NewChannelKind; icon: IconName; label: string; help: string }> = [
  { kind: "texto", icon: "chat", label: "Texto", help: "Conversa com mensagens." },
  { kind: "voz", icon: "mic", label: "Voz", help: "Sala para falar, com câmera opcional." },
  { kind: "anuncios", icon: "announcement", label: "Anúncios", help: "Todos leem; só quem pode publicar escreve." },
  { kind: "galeria", icon: "gallery", label: "Galeria", help: "Mural de imagens com descrição, #tags e comentários." },
];

const NEW_CATEGORY = "__nova__";
const NO_CATEGORY = "";

/** Criar canal: tipo, nome, categoria (existente, nenhuma ou uma nova) e descrição opcional. */
export function CreateChannelDialog({
  spaceId,
  categories,
  open,
  onOpenChange,
  initialCategoryId,
}: {
  spaceId: string;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCategoryId: string | null;
}) {
  const [kind, setKind] = useState<NewChannelKind>("texto");
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState<string>(initialCategoryId ?? NO_CATEGORY);
  const [newCategory, setNewCategory] = useState("");
  const [pending, startTransition] = useTransition();

  // Reabrir pelo + de outra categoria já escolhe aquela categoria.
  const [lastInitial, setLastInitial] = useState(initialCategoryId);
  if (open && initialCategoryId !== lastInitial) {
    setLastInitial(initialCategoryId);
    setCategory(initialCategoryId ?? NO_CATEGORY);
  }

  function reset() {
    setKind("texto");
    setName("");
    setTopic("");
    setNewCategory("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Dê um nome ao canal.");
    if (category === NEW_CATEGORY && !newCategory.trim()) return toast.error("Dê um nome à categoria nova.");
    startTransition(async () => {
      const result = await createChannelAction({
        spaceId,
        kind,
        name,
        topic,
        categoryId: category === NEW_CATEGORY || category === NO_CATEGORY ? null : category,
        newCategory: category === NEW_CATEGORY ? newCategory : undefined,
      });
      // Sucesso redireciona para o canal novo; só volta aqui com erro.
      if (result?.error) toast.error(result.error);
      else {
        onOpenChange(false);
        reset();
      }
    });
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
      title="Criar canal"
    >
      <form onSubmit={submit} className={styles.dialogSection} noValidate>
        <fieldset className={styles.kinds}>
          <legend className={styles.label} style={{ marginBottom: "var(--space-2)" }}>
            Tipo
          </legend>
          {KINDS.map((k) => (
            <label key={k.kind} className={styles.kind}>
              <input type="radio" name="kind" value={k.kind} checked={kind === k.kind} onChange={() => setKind(k.kind)} />
              <Icon name={k.icon} size={20} />
              <span className={styles.kindText}>
                <strong>{k.label}</strong>
                <span className={styles.help}>{k.help}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <label className={styles.field}>
          <span className={styles.label}>Nome</span>
          <input
            className={styles.input}
            value={name}
            maxLength={40}
            autoComplete="off"
            placeholder={kind === "voz" ? "Taverna" : "planos-da-sessao"}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Categoria</span>
            <select className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value={NO_CATEGORY}>Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value={NEW_CATEGORY}>Nova categoria…</option>
            </select>
          </label>
          {category === NEW_CATEGORY && (
            <label className={styles.field}>
              <span className={styles.label}>Nome da categoria</span>
              <input className={styles.input} value={newCategory} maxLength={40} autoComplete="off" onChange={(e) => setNewCategory(e.target.value)} />
            </label>
          )}
        </div>

        {kind !== "voz" && (
          <label className={styles.field}>
            <span className={styles.label}>
              Descrição <span className={styles.help}>(opcional)</span>
            </span>
            <input className={styles.input} value={topic} maxLength={200} autoComplete="off" onChange={(e) => setTopic(e.target.value)} />
          </label>
        )}
        <div className={styles.actions}>
          <Button type="submit" variant="primary" icon="plus" loading={pending} loadingLabel="Criando…">
            Criar canal
          </Button>
        </div>
      </form>
    </Modal>
  );
}
