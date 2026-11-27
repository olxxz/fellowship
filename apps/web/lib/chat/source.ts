import type { Attachment } from "@fellowship/db";

// O mesmo chat serve para canais (tabela messages) e conversas diretas (direct_messages).
// Esta "fonte" diz em que tabela ler e escrever, como filtrar o tempo real e onde guardar anexos.

export interface ChatMsg {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  kind: "texto" | "figurinha" | "rolagem" | "sistema";
  edited_at: string | null;
  reply_to: string | null;
  mentions: string[];
  attachments: Attachment[];
  /** Rolagem oculta: só o autor e o mestre veem. */
  visibility?: "todos" | "mestre";
  pending?: boolean;
}

export interface ChatAuthor {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  color: string;
}

export type ChatSource =
  | { type: "channel"; id: string; spaceId: string; name: string; topic?: string | null }
  | { type: "dm"; userA: string; userB: string; name: string };

export const CHANNEL_COLUMNS = "id, author_id, content, created_at, kind, edited_at, reply_to, mentions, attachments, visibility";
export const DM_COLUMNS = "id, author_id, content, created_at, kind, edited_at, reply_to, attachments";

export const tableOf = (s: ChatSource) => (s.type === "channel" ? "messages" : "direct_messages");
export const reactionsTableOf = (s: ChatSource) => (s.type === "channel" ? "message_reactions" : "direct_reactions");
export const columnsOf = (s: ChatSource) => (s.type === "channel" ? CHANNEL_COLUMNS : DM_COLUMNS);
export const attachmentPrefix = (s: ChatSource) => (s.type === "channel" ? `c/${s.id}` : `d/${s.userA}_${s.userB}`);
export const sourceKey = (s: ChatSource) => (s.type === "channel" ? `canal:${s.id}` : `conversa:${s.userA}:${s.userB}`);

/** Normaliza a linha do banco (conversas diretas não têm menções). */
export function toChatMsg(row: Partial<ChatMsg> & { id: string; author_id: string; content: string; created_at: string }): ChatMsg {
  return {
    id: row.id,
    author_id: row.author_id,
    content: row.content,
    created_at: row.created_at,
    kind: (row.kind as ChatMsg["kind"]) ?? "texto",
    edited_at: row.edited_at ?? null,
    reply_to: row.reply_to ?? null,
    mentions: row.mentions ?? [],
    attachments: row.attachments ?? [],
    visibility: row.visibility ?? "todos",
  };
}

/** Campos fixos de uma mensagem nova, conforme a fonte. */
export function insertBase(s: ChatSource, authorId: string) {
  return s.type === "channel" ? { space_id: s.spaceId, channel_id: s.id, author_id: authorId } : { user_a: s.userA, user_b: s.userB, author_id: authorId };
}

/** Filtro do tempo real (o Supabase aceita um filtro só; na conversa, conferimos user_b no cliente). */
export function realtimeFilter(s: ChatSource) {
  return s.type === "channel" ? `channel_id=eq.${s.id}` : `user_a=eq.${s.userA}`;
}
export function belongs(s: ChatSource, row: Record<string, unknown>) {
  return s.type === "channel" ? row.channel_id === s.id : row.user_a === s.userA && row.user_b === s.userB;
}

const MENTION = /(^|\s)@([a-z0-9_.]{3,20})\b/g;
/** Ids de quem foi mencionado com @nick, entre as pessoas que podem ler. */
export function extractMentions(content: string, authors: Record<string, ChatAuthor>) {
  const byNick = new Map(Object.values(authors).map((a) => [a.username, a.id]));
  const ids = new Set<string>();
  for (const m of content.matchAll(MENTION)) {
    const id = byNick.get(m[2]!);
    if (id) ids.add(id);
  }
  return [...ids];
}

export const URL_RE = /https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]]/g;
