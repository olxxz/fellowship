"use client";

import { Button, Icon, IconButton } from "@fellowship/ui";
import type { Category, Channel, Role } from "@fellowship/db";
import { Fragment, useEffect, useState, useTransition } from "react";
import { channelIcon } from "@/lib/app/channels";
import {
  createCategoryAction,
  deleteCategoryAction,
  deleteChannelAction,
  getChannelOverridesAction,
  reorderCategoriesAction,
  reorderChannelsAction,
  setChannelOverrideAction,
  updateCategoryAction,
  updateChannelAction,
} from "@/lib/app/manage-actions";
import { CHANNEL_PERMISSIONS, Permission, PERMISSION_LABELS } from "@/lib/app/permission-labels";
import styles from "./Settings.module.sass";

const move = <T,>(list: T[], i: number, d: number) => {
  const next = [...list];
  const [item] = next.splice(i, 1);
  next.splice(i + d, 0, item!);
  return next;
};

/** Canais e categorias: renomear, mover, apagar e ajustar permissões por cargo em cada canal. */
export function ChannelsManager({ spaceId, categories, channels, roles }: { spaceId: string; categories: Category[]; channels: Channel[]; roles: Role[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<{ id: string; panel: "edit" | "perms" } | null>(null);
  const [newCat, setNewCat] = useState("");
  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r.error) setError(r.error);
    });

  const loose = channels.filter((c) => !c.category_id);
  const groups: Array<{ cat: Category | null; items: Channel[] }> = [
    ...(loose.length ? [{ cat: null, items: loose }] : []),
    ...categories.map((cat) => ({ cat, items: channels.filter((c) => c.category_id === cat.id) })),
  ];

  return (
    <div className={styles.dialogSection}>
      <form
        className={styles.inlineForm}
        onSubmit={(e) => {
          e.preventDefault();
          if (newCat.trim())
            run(async () => {
              const result = await createCategoryAction(spaceId, newCat);
              if (!result.error) setNewCat("");
              return result;
            });
        }}
      >
        <input className={styles.input} value={newCat} maxLength={40} placeholder="Nova categoria" aria-label="Nome da nova categoria" onChange={(e) => setNewCat(e.target.value)} />
        <Button type="submit" icon="plus" disabled={pending || !newCat.trim()}>
          Criar categoria
        </Button>
      </form>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {groups.map(({ cat, items }) => (
        <section key={cat?.id ?? "sem"} className={styles.manageGroup}>
          <header className={styles.manageGroupHeader}>
            {cat ? (
              <CategoryTitle
                cat={cat}
                onRename={(name) => run(() => updateCategoryAction(spaceId, cat.id, name))}
                onDelete={() => run(() => deleteCategoryAction(spaceId, cat.id))}
                onUp={categories.indexOf(cat) > 0 ? () => run(() => reorderCategoriesAction(spaceId, move(categories, categories.indexOf(cat), -1).map((c) => c.id))) : undefined}
                onDown={categories.indexOf(cat) < categories.length - 1 ? () => run(() => reorderCategoriesAction(spaceId, move(categories, categories.indexOf(cat), 1).map((c) => c.id))) : undefined}
                busy={pending}
              />
            ) : (
              <h4 className={styles.manageGroupTitle}>Sem categoria</h4>
            )}
          </header>
          {items.length === 0 && <p className={styles.help}>Nenhum canal aqui.</p>}
          <ul className={styles.list}>
            {items.map((c, i) => (
              <Fragment key={c.id}>
                <li className={styles.manageRow}>
                  <Icon name={channelIcon(c)} size={18} />
                  <span className={styles.personName}>{c.name}</span>
                  <span className={styles.personActions}>
                    <IconButton icon="chevronDown" label={`Subir ${c.name}`} variant="ghost" className={styles.flipUp} disabled={pending || i === 0} onClick={() => run(() => reorderChannelsAction(spaceId, cat?.id ?? null, move(items, i, -1).map((x) => x.id)))} />
                    <IconButton icon="chevronDown" label={`Descer ${c.name}`} variant="ghost" disabled={pending || i === items.length - 1} onClick={() => run(() => reorderChannelsAction(spaceId, cat?.id ?? null, move(items, i, 1).map((x) => x.id)))} />
                    <IconButton icon="pencil" label={`Editar ${c.name}`} variant="ghost" aria-pressed={open?.id === c.id && open.panel === "edit"} onClick={() => setOpen(open?.id === c.id && open.panel === "edit" ? null : { id: c.id, panel: "edit" })} />
                    <IconButton icon="lock" label={`Permissões de ${c.name}`} variant="ghost" aria-pressed={open?.id === c.id && open.panel === "perms"} onClick={() => setOpen(open?.id === c.id && open.panel === "perms" ? null : { id: c.id, panel: "perms" })} />
                  </span>
                </li>
                {open?.id === c.id && open.panel === "edit" && (
                  <li className={styles.managePanel}>
                    <ChannelEdit
                      channel={c}
                      categories={categories}
                      busy={pending}
                      onSave={(name, topic, categoryId) =>
                        run(async () => {
                          const result = await updateChannelAction(spaceId, c.id, name, topic, categoryId);
                          if (!result.error) setOpen(null);
                          return result;
                        })
                      }
                      onDelete={() =>
                        run(async () => {
                          const result = await deleteChannelAction(spaceId, c.id);
                          if (!result.error) setOpen(null);
                          return result;
                        })
                      }
                    />
                  </li>
                )}
                {open?.id === c.id && open.panel === "perms" && (
                  <li className={styles.managePanel}>
                    <ChannelPermissions spaceId={spaceId} channel={c} roles={roles} />
                  </li>
                )}
              </Fragment>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function CategoryTitle({ cat, onRename, onDelete, onUp, onDown, busy }: { cat: Category; onRename: (n: string) => void; onDelete: () => void; onUp?: () => void; onDown?: () => void; busy: boolean }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [confirm, setConfirm] = useState(false);
  return editing ? (
    <form
      className={styles.inlineForm}
      onSubmit={(e) => {
        e.preventDefault();
        onRename(name);
        setEditing(false);
      }}
    >
      <input className={styles.input} value={name} maxLength={40} aria-label="Nome da categoria" autoFocus onChange={(e) => setName(e.target.value)} />
      <Button type="submit" variant="primary">
        Salvar
      </Button>
      <Button variant="ghost" onClick={() => setEditing(false)}>
        Cancelar
      </Button>
    </form>
  ) : (
    <>
      <h4 className={styles.manageGroupTitle}>{cat.name}</h4>
      <span className={styles.personActions}>
        <IconButton icon="chevronDown" label={`Subir ${cat.name}`} variant="ghost" className={styles.flipUp} disabled={busy || !onUp} onClick={onUp} />
        <IconButton icon="chevronDown" label={`Descer ${cat.name}`} variant="ghost" disabled={busy || !onDown} onClick={onDown} />
        <IconButton icon="pencil" label={`Renomear ${cat.name}`} variant="ghost" onClick={() => setEditing(true)} />
        {confirm ? (
          <Button variant="danger" onClick={onDelete}>
            Apagar categoria
          </Button>
        ) : (
          <IconButton icon="trash" label={`Apagar ${cat.name}`} variant="ghost" onClick={() => setConfirm(true)} />
        )}
      </span>
    </>
  );
}

function ChannelEdit({ channel, categories, busy, onSave, onDelete }: { channel: Channel; categories: Category[]; busy: boolean; onSave: (name: string, topic: string, categoryId: string | null) => void; onDelete: () => void }) {
  const [name, setName] = useState(channel.name);
  const [topic, setTopic] = useState(channel.topic ?? "");
  const [category, setCategory] = useState(channel.category_id ?? "");
  const [confirm, setConfirm] = useState(false);
  return (
    <form
      className={styles.dialogSection}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(name, topic, category || null);
      }}
    >
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Nome</span>
          <input className={styles.input} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Categoria</span>
          <select className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.label}>Descrição</span>
        <input className={styles.input} value={topic} maxLength={200} onChange={(e) => setTopic(e.target.value)} />
      </label>
      <div className={styles.actions}>
        <Button type="submit" variant="primary" loading={busy} loadingLabel="Salvando…">
          Salvar
        </Button>
        {confirm ? (
          <Button variant="danger" icon="trash" onClick={onDelete}>
            Apagar de vez (com as mensagens)
          </Button>
        ) : (
          <Button variant="ghost" icon="trash" onClick={() => setConfirm(true)}>
            Apagar canal
          </Button>
        )}
      </div>
    </form>
  );
}

type Tri = "herdar" | "permitir" | "negar";

/** Ajustes por cargo neste canal. "Canal privado" = negar Ver para todos e permitir para alguns cargos. */
function ChannelPermissions({ spaceId, channel, roles }: { spaceId: string; channel: Channel; roles: Role[] }) {
  const [overrides, setOverrides] = useState<Record<string, { allow: number; deny: number }> | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [roleId, setRoleId] = useState(roles.find((r) => r.is_default)?.id ?? roles[0]?.id ?? "");

  useEffect(() => {
    let alive = true;
    void getChannelOverridesAction(channel.id).then((list) => alive && setOverrides(Object.fromEntries(list.map((o) => [o.role_id, { allow: o.allow, deny: o.deny }]))));
    return () => {
      alive = false;
    };
  }, [channel.id]);

  if (overrides === null) return <p className={styles.help}>Carregando…</p>;

  const current = overrides[roleId] ?? { allow: 0, deny: 0 };
  const stateOf = (bit: number): Tri => (current.allow & bit ? "permitir" : current.deny & bit ? "negar" : "herdar");
  const set = (bit: number, tri: Tri) => {
    const allow = tri === "permitir" ? current.allow | bit : current.allow & ~bit;
    const deny = tri === "negar" ? current.deny | bit : current.deny & ~bit;
    setOverrides({ ...overrides, [roleId]: { allow, deny } });
    start(async () => {
      setError(null);
      const r = await setChannelOverrideAction(spaceId, channel.id, roleId, allow, deny);
      if (r.error) setError(r.error);
    });
  };
  const sorted = [...roles].sort((a, b) => (a.is_default ? 1 : b.is_default ? -1 : b.position - a.position));

  return (
    <div className={styles.dialogSection}>
      <label className={styles.field}>
        <span className={styles.label}>Cargo</span>
        <select className={styles.input} value={roleId} onChange={(e) => setRoleId(e.target.value)}>
          {sorted.map((r) => (
            <option key={r.id} value={r.id}>
              {r.is_default ? "@todos (todos os membros)" : r.name}
              {overrides[r.id] && (overrides[r.id]!.allow || overrides[r.id]!.deny) ? " · ajustado" : ""}
            </option>
          ))}
        </select>
      </label>
      <p className={styles.help}>
        Herdar usa o que o cargo já tem. Para um canal privado: em @todos, negue Ver canais; depois, nos cargos que podem entrar, permita.
      </p>
      <ul className={styles.list}>
        {CHANNEL_PERMISSIONS.map((key) => {
          const meta = PERMISSION_LABELS.find((p) => p.key === key)!;
          const bit = Permission[key];
          const value = stateOf(bit);
          return (
            <li key={key} className={styles.permRow}>
              <span className={styles.personText}>
                <span className={styles.personName}>{meta.label}</span>
                <span className={styles.help}>{meta.help}</span>
              </span>
              <span className={styles.segmented} role="radiogroup" aria-label={meta.label}>
                {(["negar", "herdar", "permitir"] as Tri[]).map((t) => (
                  <button key={t} type="button" role="radio" aria-checked={value === t} data-tone={t} disabled={pending} onClick={() => set(bit, t)}>
                    {t === "negar" ? <Icon name="close" size={14} /> : t === "permitir" ? <Icon name="check" size={14} /> : "/"}
                    <span className={styles.hiddenText}>{t}</span>
                  </button>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
