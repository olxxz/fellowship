"use client";

import { Icon, toast } from "@fellowship/ui";
import type { Reaction, Sticker } from "@fellowship/db";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  attachmentPrefix,
  belongs,
  columnsOf,
  extractMentions,
  insertBase,
  reactionsTableOf,
  realtimeFilter,
  sourceKey,
  tableOf,
  toChatMsg,
  type ChatAuthor,
  type ChatMsg,
  type ChatSource,
} from "@/lib/chat/source";
import { getBrowserClient } from "@/lib/supabase/client";
import { notifyPush } from "@/lib/push";
import { uploadAttachment } from "@/lib/upload";
import { Composer } from "./Composer";
import { MessageItem, type ReactionGroup } from "./MessageItem";
import styles from "./ChatRoom.module.sass";

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export interface ChatRoomProps {
  source: ChatSource;
  me: ChatAuthor;
  /** Quem pode aparecer na conversa (membros do Cenário ou as duas pessoas). */
  authors: Record<string, ChatAuthor>;
  initialMessages: ChatMsg[];
  initialReactions: Reaction[];
  stickers: Sticker[];
  canSend: boolean;
  /** Pode apagar mensagens dos outros (Gerenciar mensagens). */
  canManage: boolean;
  readOnlyReason?: string;
  intro: { title: string; text: string };
}

/**
 * Chat completo para canais e conversas diretas: tempo real (com busca do que faltou e reserva por polling),
 * envio otimista, anexos, responder, editar, apagar, reações, menções, figurinhas e marcar como lido.
 */
export function ChatRoom({ source, me, authors, initialMessages, initialReactions, stickers, canSend, canManage, readOnlyReason, intro }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const logRef = useRef<HTMLOListElement>(null);
  const stick = useRef(true);
  const table = tableOf(source);
  const rTable = reactionsTableOf(source);
  const key = sourceKey(source);
  const allAuthors = useMemo(() => ({ ...authors, [me.id]: me }), [authors, me]);

  const markRead = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    const supabase = getBrowserClient();
    if (source.type === "channel") void supabase.rpc("mark_channel_read", { p_channel: source.id });
    else void supabase.rpc("mark_direct_read", { p_other: source.userA === me.id ? source.userB : source.userA });
    window.dispatchEvent(new CustomEvent("fellowship:read", { detail: key }));
  }, [source, me.id, key]);

  // ── Tempo real, busca do que faltou e reserva por polling ──
  useEffect(() => {
    const supabase = getBrowserClient();
    let disposed = false;
    let live = false;
    let sub: RealtimeChannel | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const merge = (incoming: ChatMsg[]) =>
      setMessages((all) => {
        const byId = new Map(all.map((m) => [m.id, m]));
        let changed = false;
        for (const m of incoming) {
          const old = byId.get(m.id);
          if (!old || old.edited_at !== m.edited_at || old.content !== m.content) {
            byId.set(m.id, m);
            changed = true;
          }
        }
        if (!changed) return all;
        return [...byId.values()].sort((a, b) => (a.pending ? 1 : 0) - (b.pending ? 1 : 0) || a.created_at.localeCompare(b.created_at));
      });

    const catchUp = async () => {
      let q = supabase.from(table).select(columnsOf(source)).order("created_at", { ascending: false }).limit(60);
      q = source.type === "channel" ? q.eq("channel_id", source.id) : q.eq("user_a", source.userA).eq("user_b", source.userB);
      const { data } = await q;
      if (disposed || !data) return;
      const rows = (data as unknown as ChatMsg[]).map(toChatMsg);
      merge(rows);
      const ids = rows.map((r) => r.id);
      if (ids.length) {
        const { data: rs } = await supabase.from(rTable).select("message_id, user_id, emoji").in("message_id", ids);
        if (!disposed && rs) setReactions((all) => [...all.filter((r) => !ids.includes(r.message_id)), ...(rs as Reaction[])]);
      }
    };

    const connect = async () => {
      const { data } = await supabase.auth.getSession();
      if (disposed) return;
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      if (sub) await supabase.removeChannel(sub);
      sub = supabase
        .channel(`${key}:${crypto.randomUUID()}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table, filter: realtimeFilter(source) }, (p) => {
          if (!belongs(source, p.new)) return;
          merge([toChatMsg(p.new as ChatMsg)]);
          markRead();
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table, filter: realtimeFilter(source) }, (p) => {
          if (belongs(source, p.new)) merge([toChatMsg(p.new as ChatMsg)]);
        })
        .on("postgres_changes", { event: "DELETE", schema: "public", table }, (p) => {
          const id = (p.old as { id?: string }).id;
          if (id) setMessages((all) => all.filter((m) => m.id !== id));
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: rTable }, (p) => {
          const r = p.new as Reaction;
          setReactions((all) => (all.some((x) => x.message_id === r.message_id && x.user_id === r.user_id && x.emoji === r.emoji) ? all : [...all, r]));
        })
        .on("postgres_changes", { event: "DELETE", schema: "public", table: rTable }, (p) => {
          const r = p.old as Reaction;
          setReactions((all) => all.filter((x) => !(x.message_id === r.message_id && x.user_id === r.user_id && x.emoji === r.emoji)));
        })
        .subscribe((status) => {
          if (disposed) return;
          live = status === "SUBSCRIBED";
          if (live) void catchUp();
          else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            clearTimeout(retry);
            retry = setTimeout(() => void connect(), 3000);
          }
        });
    };

    void connect();
    markRead();
    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "TOKEN_REFRESHED" || event === "SIGNED_IN")) void supabase.realtime.setAuth(session.access_token);
    });
    const poll = setInterval(() => {
      if (!live && document.visibilityState === "visible") void catchUp();
    }, 4000);
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void catchUp();
      markRead();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      disposed = true;
      clearTimeout(retry);
      clearInterval(poll);
      authSub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
      if (sub) void supabase.removeChannel(sub);
    };
    // A fonte é identificada pela chave; o resto é estável.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Rola para o fim quando chega mensagem, se a pessoa já estava no fim.
  useEffect(() => {
    const el = logRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const reactionGroups = useMemo(() => {
    const map = new Map<string, Map<string, ReactionGroup>>();
    for (const r of reactions) {
      const g = map.get(r.message_id) ?? new Map<string, ReactionGroup>();
      const e = g.get(r.emoji) ?? { emoji: r.emoji, count: 0, mine: false, names: [] };
      e.count++;
      e.mine ||= r.user_id === me.id;
      e.names.push(allAuthors[r.user_id]?.display_name ?? "Alguém");
      g.set(r.emoji, e);
      map.set(r.message_id, g);
    }
    return map;
  }, [reactions, me.id, allAuthors]);

  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  // ── Ações ──
  async function send(text: string, files: File[]) {
    const supabase = getBrowserClient();
    const attachments = await Promise.all(files.map((f) => uploadAttachment(attachmentPrefix(source), f)));
    const tempId = `temp-${crypto.randomUUID()}`;
    const mentions = source.type === "channel" ? extractMentions(text, allAuthors) : [];
    const optimistic: ChatMsg = {
      id: tempId,
      author_id: me.id,
      content: text,
      created_at: new Date().toISOString(),
      kind: "texto",
      edited_at: null,
      reply_to: replyTo,
      mentions,
      attachments,
      pending: true,
    };
    stick.current = true;
    setMessages((all) => [...all, optimistic]);
    const reply = replyTo;
    setReplyTo(null);
    const payload: Record<string, unknown> = { ...insertBase(source, me.id), content: text, reply_to: reply, attachments, ...(source.type === "channel" ? { mentions } : {}) };
    const { data, error: err } = await supabase.from(table).insert(payload).select(columnsOf(source)).single();
    if (err || !data) {
      setMessages((all) => all.filter((m) => m.id !== tempId));
      setReplyTo(reply);
      throw new Error("Não foi possível enviar. Confira a conexão e tente de novo.");
    }
    const saved = toChatMsg(data as unknown as ChatMsg);
    if (source.type === "dm" || mentions.length) notifyPush(source.type === "dm" ? "dm" : "canal", saved.id);
    setMessages((all) => {
      const rest = all.filter((m) => m.id !== tempId);
      return rest.some((m) => m.id === saved.id) ? rest : [...rest, saved];
    });
  }

  async function sendSticker(sticker: Sticker) {
    const { data, error: err } = await getBrowserClient()
      .from(table)
      .insert({ ...insertBase(source, me.id), kind: "figurinha", content: sticker.url })
      .select(columnsOf(source))
      .single();
    if (err || !data) return toast.error("Não foi possível enviar a figurinha.");
    stick.current = true;
    const saved = toChatMsg(data as unknown as ChatMsg);
    if (source.type === "dm") notifyPush("dm", saved.id);
    setMessages((all) => (all.some((m) => m.id === saved.id) ? all : [...all, saved]));
  }

  async function saveEdit(id: string, content: string) {
    setEditing(null);
    const old = byId.get(id);
    if (!old || old.content === content) return;
    const edited_at = new Date().toISOString();
    setMessages((all) => all.map((m) => (m.id === id ? { ...m, content, edited_at } : m)));
    const patch: Record<string, unknown> = { content, edited_at, ...(source.type === "channel" ? { mentions: extractMentions(content, allAuthors) } : {}) };
    const { error: err } = await getBrowserClient().from(table).update(patch).eq("id", id);
    if (err) {
      setMessages((all) => all.map((m) => (m.id === id ? old : m)));
      toast.error("Não foi possível editar a mensagem.");
    }
  }

  async function remove(id: string) {
    const old = byId.get(id);
    setMessages((all) => all.filter((m) => m.id !== id));
    const { error: err } = await getBrowserClient().from(table).delete().eq("id", id);
    if (err && old) {
      setMessages((all) => [...all, old].sort((a, b) => a.created_at.localeCompare(b.created_at)));
      toast.error("Não foi possível apagar a mensagem.");
    }
  }

  async function toggleReaction(messageId: string, emoji: string) {
    const supabase = getBrowserClient();
    const mine = reactions.some((r) => r.message_id === messageId && r.user_id === me.id && r.emoji === emoji);
    if (mine) {
      setReactions((all) => all.filter((r) => !(r.message_id === messageId && r.user_id === me.id && r.emoji === emoji)));
      await supabase.from(rTable).delete().match({ message_id: messageId, user_id: me.id, emoji });
    } else {
      setReactions((all) => [...all, { message_id: messageId, user_id: me.id, emoji }]);
      const { error: err } = await supabase.from(rTable).insert({ message_id: messageId, user_id: me.id, emoji });
      if (err && err.code !== "23505") setReactions((all) => all.filter((r) => !(r.message_id === messageId && r.user_id === me.id && r.emoji === emoji)));
    }
  }

  function jumpTo(id: string) {
    const el = document.getElementById(`msg-${id}`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    el?.classList.add(styles.flash!);
    setTimeout(() => el?.classList.remove(styles.flash!), 1200);
  }

  const reply = replyTo ? byId.get(replyTo) : undefined;

  return (
    <div className={styles.chat}>
      <ol
        ref={logRef}
        className={styles.log}
        role="log"
        aria-label={`Mensagens de ${source.name}`}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        <li className={styles.intro}>
          <h2 className={styles.introTitle}>{intro.title}</h2>
          <p className={styles.introText}>{intro.text}</p>
        </li>
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const continuation =
            !!prev && prev.author_id === m.author_id && new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_WINDOW_MS;
          const replied = m.reply_to ? byId.get(m.reply_to) : undefined;
          return (
            <li key={m.id}>
              <MessageItem
                msg={m}
                author={allAuthors[m.author_id]}
                authors={allAuthors}
                meId={me.id}
                continuation={continuation}
                reply={m.reply_to ? { msg: replied, author: replied ? allAuthors[replied.author_id] : undefined } : undefined}
                reactions={[...(reactionGroups.get(m.id)?.values() ?? [])]}
                canDelete={m.author_id === me.id || canManage}
                canReact={canSend || source.type === "channel"}
                editing={editing === m.id}
                onReply={() => setReplyTo(m.id)}
                onStartEdit={() => setEditing(m.id)}
                onSaveEdit={(c) => void saveEdit(m.id, c)}
                onCancelEdit={() => setEditing(null)}
                onDelete={() => void remove(m.id)}
                onToggleReaction={(e) => void toggleReaction(m.id, e)}
                onJumpTo={jumpTo}
              />
            </li>
          );
        })}
      </ol>
      {canSend ? (
        <Composer
          placeholder={source.type === "channel" ? `Conversar em ${source.name}` : `Mensagem para ${source.name}`}
          authors={allAuthors}
          meId={me.id}
          stickers={stickers}
          replyTo={reply ? { name: allAuthors[reply.author_id]?.display_name ?? "Alguém", text: reply.kind === "figurinha" ? "figurinha" : reply.content.slice(0, 80) || "anexo" } : null}
          onCancelReply={() => setReplyTo(null)}
          onSend={send}
          onSticker={(s) => void sendSticker(s)}
          onEditLast={() => {
            const last = [...messages].reverse().find((m) => m.author_id === me.id && m.kind === "texto" && !m.pending);
            if (last) setEditing(last.id);
          }}
        />
      ) : (
        <div className={styles.composer}>
          <p className={styles.readOnly}>
            <Icon name="lock" size={16} />
            {readOnlyReason}
          </p>
        </div>
      )}
    </div>
  );
}
