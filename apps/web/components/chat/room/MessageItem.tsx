"use client";

import { ChatMessage, cx, Icon, Popover, RollCard, ContextMenu, Menu, Modal, Button, toast } from "@fellowship/ui";
import type { RollPayload } from "@fellowship/db";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { QUICK_REACTIONS } from "@/lib/chat/emoji";
import { getLinkPreview, type LinkPreview } from "@/lib/chat/link-preview";
import { URL_RE, type ChatAuthor, type ChatMsg } from "@/lib/chat/source";
import { MessageAttachments } from "./Attachments";
import { EmojiPicker } from "./EmojiPicker";
import styles from "./ChatRoom.module.sass";

export interface ReactionGroup {
  emoji: string;
  count: number;
  mine: boolean;
  names: string[];
}

// O dia aparece no separador entre as mensagens; aqui só a hora.
function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

const TOKEN = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]])|((?:^|(?<=\s))@[a-z0-9_.]{3,20}\b)/g;

/** Texto com links clicáveis e @menções destacadas (a sua, mais forte). */
export function RichText({ text, authors, meId }: { text: string; authors: Record<string, ChatAuthor>; meId: string }) {
  const byNick = new Map(Object.values(authors).map((a) => [a.username, a]));
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) parts.push(text.slice(last, i));
    if (m[1]) {
      parts.push(
        <a key={i} href={m[1]} target="_blank" rel="noreferrer noopener" className={styles.link}>
          {m[1]}
        </a>,
      );
    } else {
      const who = byNick.get(m[2]!.slice(1));
      parts.push(
        who ? (
          <span key={i} className={cx(styles.mention, who.id === meId && styles.mentionMe)}>
            @{who.display_name}
          </span>
        ) : (
          m[2]
        ),
      );
    }
    last = i + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

const previews = new Map<string, Promise<LinkPreview | null>>();

function LinkPreviewCard({ url }: { url: string }) {
  const [data, setData] = useState<LinkPreview | null>(null);
  useEffect(() => {
    let alive = true;
    if (!previews.has(url)) previews.set(url, getLinkPreview(url).catch(() => null));
    void previews.get(url)!.then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, [url]);
  if (!data) return null;
  return (
    <a className={styles.preview} href={data.url} target="_blank" rel="noreferrer noopener">
      <span className={styles.previewText}>
        {data.site && <span className={styles.previewSite}>{data.site}</span>}
        <span className={styles.previewTitle}>{data.title}</span>
        {data.description && <span className={styles.previewDesc}>{data.description}</span>}
      </span>
      {data.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.previewImage} src={data.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.display = "none")} />
      )}
    </a>
  );
}

export interface MessageItemProps {
  msg: ChatMsg;
  author: ChatAuthor | undefined;
  authors: Record<string, ChatAuthor>;
  meId: string;
  continuation: boolean;
  reply?: { msg: ChatMsg | undefined; author: ChatAuthor | undefined };
  reactions: ReactionGroup[];
  canDelete: boolean;
  canReact: boolean;
  editing: boolean;
  onReply: () => void;
  onStartEdit: () => void;
  onSaveEdit: (content: string) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onToggleReaction: (emoji: string) => void;
  onJumpTo: (id: string) => void;
}

export function MessageItem(props: MessageItemProps) {
  const { msg, author, authors, meId, continuation, reply, reactions, canDelete, canReact, editing } = props;
  const mine = msg.author_id === meId;
  const mentionsMe = msg.mentions.includes(meId);
  const firstUrl = msg.kind === "texto" ? msg.content.match(URL_RE)?.[0] : undefined;
  const [confirming, setConfirming] = useState(false);

  const [askDelete, setAskDelete] = useState(false);
  const canCopy = msg.kind === "texto" && !!msg.content;
  const hasMenu = !msg.pending && !editing && (canReact || canCopy || (mine && msg.kind === "texto") || canDelete);

  return (
    <ContextMenu.Root disabled={!hasMenu}>
    <ContextMenu.Trigger render={<div className={cx(styles.item, mentionsMe && styles.itemMention)} id={`msg-${msg.id}`} />}>
      {reply && (
        <button type="button" className={styles.replyQuote} onClick={() => reply.msg && props.onJumpTo(reply.msg.id)}>
          <Icon name="reply" size={14} />
          <strong>{reply.author?.display_name ?? "Alguém"}</strong>
          <span>{reply.msg ? (reply.msg.kind === "figurinha" ? "figurinha" : reply.msg.content || "anexo") : "mensagem apagada"}</span>
        </button>
      )}
      <ChatMessage
        scope="outgame"
        author={{ name: author?.display_name ?? "Alguém", color: author?.color ?? 1, avatarUrl: author?.avatar_url ?? undefined }}
        time={formatTime(msg.created_at)}
        continuation={continuation && !reply}
        pending={msg.pending}
      >
        {editing ? (
          <EditBox initial={msg.content} onSave={props.onSaveEdit} onCancel={props.onCancelEdit} />
        ) : msg.kind === "rolagem" ? (
          <RollMessage msg={msg} author={author} />
        ) : msg.kind === "figurinha" && msg.content ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.sticker} src={msg.content} alt="Figurinha" loading="lazy" />
        ) : (
          msg.content && (
            <p className={styles.text}>
              <RichText text={msg.content} authors={authors} meId={meId} />
              {msg.edited_at && <span className={styles.edited}> (editada)</span>}
            </p>
          )
        )}
        {msg.attachments.length > 0 && <MessageAttachments items={msg.attachments} />}
        {firstUrl && !editing && <LinkPreviewCard url={firstUrl} />}
        {reactions.length > 0 && (
          <div className={styles.reactions}>
            {reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                className={cx(styles.reaction, r.mine && styles.reactionMine)}
                aria-pressed={r.mine}
                title={r.names.join(", ")}
                disabled={!canReact}
                onClick={() => props.onToggleReaction(r.emoji)}
              >
                <span>{r.emoji}</span>
                <span className={styles.reactionCount}>{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </ChatMessage>

      {!msg.pending && !editing && (
        <div className={styles.toolbar} role="toolbar" aria-label="Ações da mensagem">
          {canReact && (
            <Popover.Root>
              <Popover.Trigger className={styles.toolButton} aria-label="Reagir" title="Reagir">
                <Icon name="smile" size={16} />
              </Popover.Trigger>
              <Popover.Popup side="top" align="end">
                <div className={styles.quickReactions}>
                  {QUICK_REACTIONS.map((e) => (
                    <Popover.Close key={e} className={styles.emojiCell} onClick={() => props.onToggleReaction(e)} aria-label={`Reagir com ${e}`}>
                      {e}
                    </Popover.Close>
                  ))}
                  <EmojiPicker label="Mais emojis" side="bottom" onPick={props.onToggleReaction} />
                </div>
              </Popover.Popup>
            </Popover.Root>
          )}
          {canReact && (
            <button type="button" className={styles.toolButton} aria-label="Responder" title="Responder" onClick={props.onReply}>
              <Icon name="reply" size={16} />
            </button>
          )}
          {mine && msg.kind === "texto" && (
            <button type="button" className={styles.toolButton} aria-label="Editar" title="Editar" onClick={props.onStartEdit}>
              <Icon name="pencil" size={16} />
            </button>
          )}
          {canDelete &&
            (confirming ? (
              <>
                <button type="button" className={cx(styles.toolButton, styles.toolDanger)} onClick={props.onDelete}>
                  Apagar
                </button>
                <button type="button" className={styles.toolButton} onClick={() => setConfirming(false)}>
                  Não
                </button>
              </>
            ) : (
              <button type="button" className={styles.toolButton} aria-label="Apagar" title="Apagar" onClick={() => setConfirming(true)}>
                <Icon name="trash" size={16} />
              </button>
            ))}
        </div>
      )}
    </ContextMenu.Trigger>
    {hasMenu && (
      <ContextMenu.Popup>
        {canReact && (
          <div className={styles.menuReactions} role="group" aria-label="Reagir">
            {QUICK_REACTIONS.map((e) => (
              <Menu.Item key={e} className={styles.menuEmoji} aria-label={`Reagir com ${e}`} onClick={() => props.onToggleReaction(e)}>
                {e}
              </Menu.Item>
            ))}
          </div>
        )}
        {canReact && (
          <Menu.Item icon="reply" onClick={props.onReply}>
            Responder
          </Menu.Item>
        )}
        {canCopy && (
          <Menu.Item
            icon="copy"
            onClick={() =>
              void navigator.clipboard?.writeText(msg.content).then(
                () => toast.success("Texto copiado"),
                () => toast.error("Não foi possível copiar."),
              )
            }
          >
            Copiar texto
          </Menu.Item>
        )}
        {mine && msg.kind === "texto" && (
          <Menu.Item icon="pencil" onClick={props.onStartEdit}>
            Editar
          </Menu.Item>
        )}
        {canDelete && (
          <>
            <Menu.Separator />
            <Menu.Item icon="trash" tone="danger" onClick={() => setAskDelete(true)}>
              Apagar mensagem
            </Menu.Item>
          </>
        )}
      </ContextMenu.Popup>
    )}
    {askDelete && (
      <Modal open onOpenChange={(o) => !o && setAskDelete(false)} title="Apagar mensagem?" description="Some para todo mundo. Não dá para desfazer.">
        <div className={styles.confirmActions}>
          <Button variant="ghost" onClick={() => setAskDelete(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setAskDelete(false);
              props.onDelete();
            }}
          >
            Apagar
          </Button>
        </div>
      </Modal>
    )}
    </ContextMenu.Root>
  );
}

function EditBox({ initial, onSave, onCancel }: { initial: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    el.style.height = `${el.scrollHeight}px`;
  }, []);
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") onCancel();
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (value.trim()) onSave(value.trim());
    }
  };
  return (
    <div className={styles.editBox}>
      <textarea
        ref={ref}
        className={styles.editInput}
        value={value}
        maxLength={4000}
        aria-label="Editar mensagem"
        onChange={(e) => {
          setValue(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
        onKeyDown={onKeyDown}
      />
      <span className={styles.editHint}>Esc cancela · Enter salva</span>
    </div>
  );
}

/** Rolagem gravada pelo servidor (o JSON vem em content). Quem rolou: o personagem, se houver. */
function RollMessage({ msg, author }: { msg: ChatMsg; author: ChatAuthor | undefined }) {
  const p = parseRoll(msg.content);
  if (!p) return <p className={styles.text}>Rolagem inválida.</p>;
  return (
    <div className={styles.roll}>
      <RollCard
        roller={p.character?.name ?? author?.display_name ?? "Alguém"}
        label={p.label}
        formula={p.formula}
        dice={p.dice.map((d) => (d.discarded ? { value: d.value, discarded: true } : { value: d.value }))}
        modifier={p.modifier}
        total={p.total}
        color={(p.character?.color ?? author?.color) as never}
        hidden={msg.visibility === "mestre"}
        viewerIsMaster
        critical={p.critical}
      />
    </div>
  );
}

function parseRoll(content: string): RollPayload | null {
  try {
    return JSON.parse(content) as RollPayload;
  } catch {
    return null;
  }
}
