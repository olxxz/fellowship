"use client";

import { Button, ContextMenu, Menu, Modal, toast } from "@fellowship/ui";
import type { Category, Channel } from "@fellowship/db";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { leaveCampaignAction, deleteCampaignAction } from "@/lib/app/campaign-actions";
import { createCategoryAction, deleteCategoryAction, deleteChannelAction, updateCategoryAction, updateChannelAction } from "@/lib/app/manage-actions";
import { campaignAppHref } from "@/lib/routes";
import styles from "./Settings.module.sass";

/** Alvo do clique direito: marcado nas linhas da barra com `data-ctx="tipo:id"`. */
type Target = { kind: "space" } | { kind: "channel"; id: string } | { kind: "category"; id: string } | { kind: "campaign"; id: string };

function targetOf(node: HTMLElement): Target {
  const [kind, id] = (node.closest<HTMLElement>("[data-ctx]")?.dataset.ctx ?? "").split(":");
  return kind === "channel" || kind === "category" || kind === "campaign" ? { kind, id: id! } : { kind: "space" };
}

export const ctx = (kind: "channel" | "category" | "campaign", id: string) => ({ "data-ctx": `${kind}:${id}` });

export interface SidebarCampaign {
  id: string;
  name: string;
  myRole: string | null;
}

type Dialog =
  | { kind: "channel"; channel: Channel }
  | { kind: "category"; category: Category | null }
  | { kind: "confirm"; title: string; text: string; action: () => Promise<{ error?: string }>; done: string; after?: () => void };

/**
 * Menu do clique direito na barra do Cenário (no celular, segurar o dedo): criar canal ou categoria no
 * espaço vazio; editar e apagar canais e categorias; abrir e configurar campanhas.
 */
export function SidebarContextMenu({
  spaceId,
  categories,
  channels,
  campaigns,
  canManage,
  canCreateCampaign,
  canInvite,
  onCreateChannel,
  onCreateCampaign,
  onInvite,
  onReorder,
  children,
}: {
  spaceId: string;
  categories: Category[];
  channels: Channel[];
  campaigns: SidebarCampaign[];
  canManage: boolean;
  canCreateCampaign: boolean;
  canInvite: boolean;
  onCreateChannel: (categoryId: string | null) => void;
  onCreateCampaign: () => void;
  onInvite: () => void;
  onReorder: () => void;
  children: ReactNode;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<Target>({ kind: "space" });
  const [dialog, setDialog] = useState<Dialog | null>(null);

  const channel = target.kind === "channel" ? channels.find((c) => c.id === target.id) : undefined;
  const category = target.kind === "category" ? categories.find((c) => c.id === target.id) : undefined;
  const campaign = target.kind === "campaign" ? campaigns.find((c) => c.id === target.id) : undefined;

  function copy(text: string, what: string) {
    void navigator.clipboard?.writeText(text).then(
      () => toast.success(`${what} copiado`),
      () => toast.error("Não foi possível copiar."),
    );
  }

  let items: ReactNode;
  if (channel) {
    items = (
      <>
        <Menu.Item icon="link" onClick={() => copy(`${location.origin}/c/${spaceId}/${channel.id}`, "Link do canal")}>
          Copiar link
        </Menu.Item>
        {canManage && (
          <>
            <Menu.Item icon="pencil" onClick={() => setDialog({ kind: "channel", channel })}>
              Editar canal
            </Menu.Item>
            <Menu.Item icon="plus" onClick={() => onCreateChannel(channel.category_id)}>
              Criar canal aqui
            </Menu.Item>
            <Menu.Item icon="menu" onClick={onReorder}>
              Reorganizar
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item
              icon="trash"
              tone="danger"
              onClick={() =>
                setDialog({
                  kind: "confirm",
                  title: `Apagar ${channel.name}?`,
                  text: "As mensagens do canal somem junto. Não dá para desfazer.",
                  action: () => deleteChannelAction(spaceId, channel.id),
                  done: "Canal apagado",
                })
              }
            >
              Apagar canal
            </Menu.Item>
          </>
        )}
      </>
    );
  } else if (category) {
    items = canManage ? (
      <>
        <Menu.Item icon="plus" onClick={() => onCreateChannel(category.id)}>
          Criar canal em {category.name}
        </Menu.Item>
        <Menu.Item icon="pencil" onClick={() => setDialog({ kind: "category", category })}>
          Renomear categoria
        </Menu.Item>
        <Menu.Item icon="menu" onClick={() => setDialog({ kind: "category", category: null })}>
          Nova categoria
        </Menu.Item>
        <Menu.Item icon="menu" onClick={onReorder}>
          Reorganizar
        </Menu.Item>
        <Menu.Separator />
        <Menu.Item
          icon="trash"
          tone="danger"
          onClick={() =>
            setDialog({
              kind: "confirm",
              title: `Apagar a categoria ${category.name}?`,
              text: "Os canais dela continuam, só ficam sem categoria.",
              action: () => deleteCategoryAction(spaceId, category.id),
              done: "Categoria apagada",
            })
          }
        >
          Apagar categoria
        </Menu.Item>
      </>
    ) : null;
  } else if (campaign) {
    const master = campaign.myRole === "mestre";
    items = (
      <>
        <Menu.Item icon="dice" onClick={() => router.push(campaignAppHref(spaceId, campaign.id))}>
          Abrir a Mesa
        </Menu.Item>
        <Menu.Item icon="sheet" onClick={() => router.push(campaignAppHref(spaceId, campaign.id, "personagens"))}>
          Fichas
        </Menu.Item>
        <Menu.Item icon="users" onClick={() => router.push(campaignAppHref(spaceId, campaign.id, "membros"))}>
          Membros
        </Menu.Item>
        {master && (
          <Menu.Item icon="settings" onClick={() => router.push(campaignAppHref(spaceId, campaign.id, "ajustes"))}>
            Ajustes da campanha
          </Menu.Item>
        )}
        {campaign.myRole && (
          <>
            <Menu.Separator />
            {master ? (
              <Menu.Item
                icon="trash"
                tone="danger"
                onClick={() =>
                  setDialog({
                    kind: "confirm",
                    title: `Apagar ${campaign.name}?`,
                    text: "Canais, fichas e o histórico da campanha somem. Não dá para desfazer.",
                    action: () => deleteCampaignAction(spaceId, campaign.id),
                    done: "Campanha apagada",
                  })
                }
              >
                Apagar campanha
              </Menu.Item>
            ) : (
              <Menu.Item
                icon="doorOpen"
                tone="danger"
                onClick={() =>
                  setDialog({
                    kind: "confirm",
                    title: `Sair de ${campaign.name}?`,
                    text: "Você deixa de ver a mesa e as fichas. O mestre pode chamar você de volta.",
                    action: () => leaveCampaignAction(spaceId, campaign.id),
                    done: "Você saiu da campanha",
                  })
                }
              >
                Sair da campanha
              </Menu.Item>
            )}
          </>
        )}
      </>
    );
  } else {
    items =
      canManage || canCreateCampaign || canInvite ? (
        <>
          {canManage && (
            <>
              <Menu.Item icon="plus" onClick={() => onCreateChannel(null)}>
                Criar canal
              </Menu.Item>
              <Menu.Item icon="menu" onClick={() => setDialog({ kind: "category", category: null })}>
                Criar categoria
              </Menu.Item>
              <Menu.Item icon="menu" onClick={onReorder}>
                Reorganizar
              </Menu.Item>
            </>
          )}
          {canCreateCampaign && (
            <Menu.Item icon="dice" onClick={onCreateCampaign}>
              Criar campanha
            </Menu.Item>
          )}
          {canInvite && (
            <>
              <Menu.Separator />
              <Menu.Item icon="userPlus" onClick={onInvite}>
                Convidar pessoas
              </Menu.Item>
            </>
          )}
        </>
      ) : null;
  }

  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger
          render={<div />}
          style={{ display: "contents" }}
          // No celular, o menu abre por toque longo (sem evento contextmenu): o alvo é lido já no toque.
          onPointerDownCapture={(e) => setTarget(targetOf(e.target as HTMLElement))}
          onContextMenuCapture={(e) => {
            const next = targetOf(e.target as HTMLElement);
            const empty =
              (next.kind === "category" && !canManage) || (next.kind === "space" && !canManage && !canCreateCampaign && !canInvite);
            // Sem nada a oferecer: deixa o menu do navegador.
            if (empty) {
              e.stopPropagation();
              return;
            }
            setTarget(next);
          }}
        >
          {children}
        </ContextMenu.Trigger>
        {items && <ContextMenu.Popup>{items}</ContextMenu.Popup>}
      </ContextMenu.Root>

      {dialog?.kind === "channel" && <EditChannelDialog spaceId={spaceId} channel={dialog.channel} categories={categories} onClose={() => setDialog(null)} />}
      {dialog?.kind === "category" && <CategoryDialog spaceId={spaceId} category={dialog.category} onClose={() => setDialog(null)} />}
      {dialog?.kind === "confirm" && <ConfirmDialog {...dialog} onClose={() => setDialog(null)} />}
    </>
  );
}

function EditChannelDialog({ spaceId, channel, categories, onClose }: { spaceId: string; channel: Channel; categories: Category[]; onClose: () => void }) {
  const [name, setName] = useState(channel.name);
  const [topic, setTopic] = useState(channel.topic ?? "");
  const [categoryId, setCategoryId] = useState(channel.category_id ?? "");
  const [pending, start] = useTransition();
  const voice = channel.kind === "voz" || channel.kind === "voz_dinamica";
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="Editar canal">
      <form
        className={styles.dialogSection}
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return toast.error("Dê um nome ao canal.");
          start(async () => {
            const r = await updateChannelAction(spaceId, channel.id, name, topic, categoryId || null);
            if (r.error) return void toast.error(r.error);
            toast.success("Canal salvo");
            onClose();
          });
        }}
      >
        <label className={styles.field}>
          <span className={styles.label}>Nome</span>
          <input className={styles.input} value={name} maxLength={40} autoComplete="off" onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        {!voice && (
          <label className={styles.field}>
            <span className={styles.label}>Descrição</span>
            <input className={styles.input} value={topic} maxLength={200} autoComplete="off" onChange={(e) => setTopic(e.target.value)} />
          </label>
        )}
        <label className={styles.field}>
          <span className={styles.label}>Categoria</span>
          <select className={styles.input} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={pending} loadingLabel="Salvando…">
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CategoryDialog({ spaceId, category, onClose }: { spaceId: string; category: Category | null; onClose: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [pending, start] = useTransition();
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={category ? "Renomear categoria" : "Nova categoria"}>
      <form
        className={styles.dialogSection}
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return toast.error("Dê um nome à categoria.");
          start(async () => {
            const r = category ? await updateCategoryAction(spaceId, category.id, name) : await createCategoryAction(spaceId, name);
            if (r.error) return void toast.error(r.error);
            toast.success(category ? "Categoria renomeada" : "Categoria criada");
            onClose();
          });
        }}
      >
        <label className={styles.field}>
          <span className={styles.label}>Nome</span>
          <input className={styles.input} value={name} maxLength={40} autoComplete="off" onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={pending} loadingLabel="Salvando…">
            {category ? "Salvar" : "Criar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmDialog({ title, text, action, done, onClose }: { title: string; text: string; action: () => Promise<{ error?: string }>; done: string; onClose: () => void }) {
  const [pending, start] = useTransition();
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={title} description={text}>
      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="danger"
          loading={pending}
          loadingLabel="Um instante…"
          onClick={() =>
            start(async () => {
              const r = await action();
              if (r?.error) return void toast.error(r.error);
              toast.success(done);
              onClose();
            })
          }
        >
          Confirmar
        </Button>
      </div>
    </Modal>
  );
}
