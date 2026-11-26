"use client";

import { ChatMessage, cx, Icon, IconButton } from "@fellowship/ui";
import type { Channel, Message, Profile } from "@fellowship/db";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import styles from "@/components/chat/Chat.module.sass";
import { getBrowserClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Author = Pick<Profile, "id" | "display_name" | "avatar_url" | "color">;
type ChatItem = Message & { pending?: boolean };

const GROUP_WINDOW_MS = 5 * 60 * 1000;

function formatTime(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
  if (date.toDateString() === today.toDateString()) return `hoje ${time}`;
  return `${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date)} ${time}`;
}

export interface LiveChatProps {
  channel: Channel;
  initialMessages: Message[];
  authors: Record<string, Author>;
  me: Author;
  canSend: boolean;
  readOnlyReason: string;
}

/**
 * Chat de um canal do app real: mensagens do banco, novas mensagens em tempo real (Supabase Realtime, que respeita o RLS)
 * e envio otimista (aparece na hora, confirma quando o banco grava).
 */
export function LiveChat({ channel, initialMessages, authors, me, canSend, readOnlyReason }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatItem[]>(initialMessages);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLOListElement>(null);
  const hintId = useId();

  useEffect(() => {
    const supabase = getBrowserClient();
    let disposed = false;
    let live = false;
    let sub: RealtimeChannel | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const merge = (incoming: ChatItem[]) =>
      setMessages((all) => {
        const known = new Set(all.map((m) => m.id));
        const fresh = incoming.filter((m) => !known.has(m.id));
        if (!fresh.length) return all;
        return [...all, ...fresh].sort((a: ChatItem, b: ChatItem) => (a.pending ? 1 : 0) - (b.pending ? 1 : 0) || a.created_at.localeCompare(b.created_at));
      });

    // Busca as últimas mensagens e junta pelo id: cobre o que chegou enquanto o socket estava fora do ar.
    const catchUp = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, space_id, channel_id, author_id, scope, kind, content, created_at")
        .eq("channel_id", channel.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!disposed && data) merge((data as Message[]).reverse());
    };

    const connect = async () => {
      // O socket precisa do JWT da sessão antes de entrar no canal; sem ele entra como anônimo e o RLS não entrega nada.
      const { data } = await supabase.auth.getSession();
      if (disposed) return;
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      if (sub) await supabase.removeChannel(sub);
      sub = supabase
        .channel(`mensagens:${channel.id}:${crypto.randomUUID()}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channel.id}` }, (payload) => {
          merge([payload.new as Message]);
        })
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, (payload) => {
          const id = (payload.old as { id?: string }).id;
          if (id) setMessages((all) => all.filter((m) => m.id !== id));
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

    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "TOKEN_REFRESHED" || event === "SIGNED_IN")) void supabase.realtime.setAuth(session.access_token);
    });

    // Rede de segurança: enquanto o tempo real não está de pé, busca a cada 4 s; ao voltar para a aba, sempre busca.
    const poll = setInterval(() => {
      if (!live && document.visibilityState === "visible") void catchUp();
    }, 4000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void catchUp();
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
  }, [channel.id]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send() {
    const content = text.trim();
    if (!content) return;
    if (content.length > 4000) return setError("A mensagem passou de 4000 caracteres.");
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: ChatItem = {
      id: tempId,
      space_id: channel.space_id,
      channel_id: channel.id,
      author_id: me.id,
      scope: "outgame",
      kind: "texto",
      content,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((all) => [...all, optimistic]);
    setText("");
    setError(null);

    const { data, error } = await getBrowserClient()
      .from("messages")
      .insert({ space_id: channel.space_id, channel_id: channel.id, author_id: me.id, content })
      .select("id, space_id, channel_id, author_id, scope, kind, content, created_at")
      .single<Message>();
    if (error || !data) {
      setMessages((all) => all.filter((m) => m.id !== tempId));
      setText(content);
      setError("Não foi possível enviar. Confira a conexão e tente de novo.");
      return;
    }
    // Troca a otimista pela gravada (o Realtime pode ter entregado a mesma antes).
    setMessages((all) => {
      const withoutTemp = all.filter((m) => m.id !== tempId);
      return withoutTemp.some((m) => m.id === data.id) ? withoutTemp : [...withoutTemp, data];
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className={styles.chat}>
      <ol ref={logRef} className={styles.log} role="log" aria-label={`Mensagens de ${channel.name}`}>
        <li className={styles.intro}>
          <h2 className={styles.introTitle}>{channel.name}</h2>
          <p className={styles.introText}>{channel.topic ?? `O começo do canal ${channel.name}.`}</p>
        </li>
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const author = authors[m.author_id] ?? (m.author_id === me.id ? me : undefined);
          const continuation = !!prev && prev.author_id === m.author_id && new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_WINDOW_MS;
          return (
            <li key={m.id}>
              <ChatMessage
                scope="outgame"
                author={{ name: author?.display_name ?? "Alguém", color: author?.color ?? 1, avatarUrl: author?.avatar_url ?? undefined }}
                time={formatTime(m.created_at)}
                continuation={continuation}
                pending={m.pending}
              >
                <p style={{ whiteSpace: "pre-wrap" }}>{m.content}</p>
              </ChatMessage>
            </li>
          );
        })}
      </ol>
      {canSend ? (
        <div className={styles.composer}>
          <div className={styles.box}>
            <textarea
              className={styles.input}
              rows={1}
              value={text}
              placeholder={`Conversar em ${channel.name}`}
              aria-label={`Conversar em ${channel.name}`}
              aria-describedby={hintId}
              aria-invalid={error ? true : undefined}
              maxLength={4000}
              onChange={(e) => {
                setText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={onKeyDown}
            />
            <IconButton icon="send" label="Enviar" variant={text.trim() ? "primary" : "secondary"} onClick={() => void send()} />
          </div>
          {error ? (
            <p className={cx(styles.error)} id={hintId} role="alert">
              {error}
            </p>
          ) : (
            <p className={styles.hint} id={hintId}>
              Enter envia · Shift+Enter quebra a linha
            </p>
          )}
        </div>
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
