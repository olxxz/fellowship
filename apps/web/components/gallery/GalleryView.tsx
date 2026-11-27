"use client";

import { Avatar, Button, cx, Icon, Modal, Skeleton, toast } from "@fellowship/ui";
import type { Attachment } from "@fellowship/db";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHANNEL_COLUMNS, toChatMsg, type ChatAuthor, type ChatMsg } from "@/lib/chat/source";
import { getBrowserClient } from "@/lib/supabase/client";
import { formatSize, signedUrls, uploadAttachment } from "@/lib/upload";
import { RichText } from "@/components/chat/room/MessageItem";
import styles from "./Gallery.module.sass";

const PAGE = 30;
const TAG = /(^|\s)#([\p{L}\d_-]{2,30})/gu;
const tagsOf = (text: string) => [...text.matchAll(TAG)].map((m) => m[2]!.toLowerCase());

export interface GalleryViewProps {
  channelId: string;
  spaceId: string;
  channelName: string;
  me: ChatAuthor;
  authors: Record<string, ChatAuthor>;
  initialPosts: ChatMsg[];
  initialCommentCounts: Record<string, number>;
  canPost: boolean;
  canManage: boolean;
}

/**
 * Canal de galeria: um mural de imagens em colunas (as mais novas primeiro), cada uma com descrição, #tags e comentários.
 * Publicação = mensagem com imagens; comentário = resposta a ela (mesmas regras e permissões do chat).
 */
export function GalleryView({ channelId, spaceId, channelName, me, authors, initialPosts, initialCommentCounts, canPost, canManage }: GalleryViewProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [counts, setCounts] = useState(initialCommentCounts);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [tag, setTag] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= PAGE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const all = useMemo(() => ({ ...authors, [me.id]: me }), [authors, me]);

  // Endereços assinados das capas (primeira imagem de cada publicação).
  useEffect(() => {
    const paths = posts.map((p) => p.attachments[0]?.path).filter((p): p is string => !!p && !urls[p]);
    if (paths.length) void signedUrls(paths).then((u) => setUrls((old) => ({ ...old, ...u })));
  }, [posts, urls]);

  // Tempo real: publicação nova entra no topo; comentário novo soma no contador.
  useEffect(() => {
    const supabase = getBrowserClient();
    const sub = supabase
      .channel(`galeria:${channelId}:${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` }, (p) => {
        const m = toChatMsg(p.new as ChatMsg);
        if (m.reply_to) setCounts((c) => ({ ...c, [m.reply_to!]: (c[m.reply_to!] ?? 0) + 1 }));
        else if (m.attachments.length) setPosts((all) => (all.some((x) => x.id === m.id) ? all : [m, ...all]));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, (p) => {
        const id = (p.old as { id?: string }).id;
        if (id) setPosts((all) => all.filter((x) => x.id !== id));
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(sub);
    };
  }, [channelId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const oldest = posts[posts.length - 1];
    if (!oldest) return;
    setLoadingMore(true);
    const { data } = await getBrowserClient()
      .from("messages")
      .select(CHANNEL_COLUMNS)
      .eq("channel_id", channelId)
      .is("reply_to", null)
      .lt("created_at", oldest.created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE);
    const rows = ((data ?? []) as unknown as ChatMsg[]).map(toChatMsg);
    setPosts((all) => [...all, ...rows.filter((r) => !all.some((x) => x.id === r.id))]);
    setHasMore(rows.length >= PAGE);
    setLoadingMore(false);
  }, [loadingMore, hasMore, posts, channelId]);

  // Rolagem infinita: mais publicações quando o fim do mural aparece.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && void loadMore(), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  const allTags = useMemo(() => {
    const freq = new Map<string, number>();
    for (const p of posts) for (const t of tagsOf(p.content)) freq.set(t, (freq.get(t) ?? 0) + 1);
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t);
  }, [posts]);
  const visible = tag ? posts.filter((p) => tagsOf(p.content).includes(tag)) : posts;
  const openPost = posts.find((p) => p.id === open);

  return (
    <div className={styles.gallery}>
      <div className={styles.toolbar}>
        {allTags.length > 0 && (
          <div className={styles.tags} role="group" aria-label="Filtrar por tag">
            <button type="button" className={cx(styles.tag, !tag && styles.tagActive)} aria-pressed={!tag} onClick={() => setTag(null)}>
              Tudo
            </button>
            {allTags.map((t) => (
              <button key={t} type="button" className={cx(styles.tag, tag === t && styles.tagActive)} aria-pressed={tag === t} onClick={() => setTag(tag === t ? null : t)}>
                #{t}
              </button>
            ))}
          </div>
        )}
        {canPost && (
          <Button variant="primary" icon="plus" onClick={() => setComposing(true)}>
            Publicar
          </Button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <Icon name="gallery" size={30} />
          <p>{tag ? `Nada com #${tag} ainda.` : `${channelName} ainda está vazio. ${canPost ? "Publique a primeira imagem." : ""}`}</p>
        </div>
      ) : (
        <ul className={styles.masonry}>
          {visible.map((p) => {
            const cover = p.attachments[0];
            const author = all[p.author_id];
            return (
              <li key={p.id} className={styles.card}>
                <button type="button" className={styles.cardButton} onClick={() => setOpen(p.id)} aria-label={`Abrir publicação de ${author?.display_name ?? "alguém"}`}>
                  {cover && urls[cover.path] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={urls[cover.path]} alt={p.content || cover.name} width={cover.width} height={cover.height} loading="lazy" />
                  ) : (
                    <Skeleton height={cover?.width && cover.height ? undefined : 180} style={cover?.width && cover.height ? { aspectRatio: `${cover.width} / ${cover.height}` } : undefined} />
                  )}
                  {p.attachments.length > 1 && <span className={styles.more}>+{p.attachments.length - 1}</span>}
                </button>
                <div className={styles.cardMeta}>
                  <Avatar name={author?.display_name ?? "?"} src={author?.avatar_url ?? undefined} color={author?.color} size={22} />
                  <span className={styles.cardText}>{p.content ? p.content.replace(TAG, "$1").trim() || p.content : author?.display_name}</span>
                  {(counts[p.id] ?? 0) > 0 && (
                    <span className={styles.count}>
                      <Icon name="chat" size={14} />
                      {counts[p.id]}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div ref={sentinel} />
      {loadingMore && (
        <div className={styles.masonry} aria-hidden="true">
          {[220, 160, 280].map((h, i) => (
            <Skeleton key={i} height={h} style={{ borderRadius: "var(--radius-lg)", marginBottom: 12 }} />
          ))}
        </div>
      )}

      {composing && (
        <NewPost
          channelId={channelId}
          spaceId={spaceId}
          me={me}
          onClose={() => setComposing(false)}
          onPosted={(m) => {
            setPosts((all) => (all.some((x) => x.id === m.id) ? all : [m, ...all]));
            setComposing(false);
          }}
        />
      )}
      {openPost && (
        <PostDetail
          post={openPost}
          authors={all}
          me={me}
          spaceId={spaceId}
          channelId={channelId}
          canPost={canPost}
          canDelete={openPost.author_id === me.id || canManage}
          onClose={() => setOpen(null)}
          onDeleted={() => {
            setPosts((all) => all.filter((x) => x.id !== openPost.id));
            setOpen(null);
          }}
        />
      )}
    </div>
  );
}

function NewPost({ channelId, spaceId, me, onClose, onPosted }: { channelId: string; spaceId: string; me: ChatAuthor; onClose: () => void; onPosted: (m: ChatMsg) => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  async function publish() {
    if (!files.length) return toast.error("Escolha ao menos uma imagem.");
    setBusy(true);
    try {
      const attachments: Attachment[] = [];
      for (const f of files) attachments.push(await uploadAttachment(`c/${channelId}`, f));
      const { data, error } = await getBrowserClient()
        .from("messages")
        .insert({ space_id: spaceId, channel_id: channelId, author_id: me.id, content: text.trim(), attachments })
        .select(CHANNEL_COLUMNS)
        .single();
      if (error || !data) throw new Error("Não foi possível publicar.");
      toast.success("Publicado");
      onPosted(toChatMsg(data as unknown as ChatMsg));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível publicar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="Nova publicação">
      <div className={styles.form}>
        {files.length > 0 ? (
          <ul className={styles.previews}>
            {previews.map((u, i) => (
              <li key={u}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" />
                <button type="button" aria-label={`Tirar ${files[i]!.name}`} onClick={() => setFiles((all) => all.filter((_, j) => j !== i))}>
                  <Icon name="close" size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <button type="button" className={styles.drop} onClick={() => input.current?.click()}>
            <Icon name="gallery" size={28} />
            Escolher imagens (até 10, GIF também)
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const picked = [...(e.target.files ?? [])].filter((f) => f.type.startsWith("image/")).slice(0, 10);
            setFiles((all) => [...all, ...picked].slice(0, 10));
            e.target.value = "";
          }}
        />
        {files.length > 0 && files.length < 10 && (
          <Button variant="ghost" icon="plus" onClick={() => input.current?.click()}>
            Mais imagens
          </Button>
        )}
        <label className={styles.field}>
          <span>Descrição</span>
          <textarea value={text} maxLength={2000} rows={3} placeholder="Conte algo. Use #tags para organizar (#mapa, #npc…)" onChange={(e) => setText(e.target.value)} />
        </label>
        <div className={styles.actions}>
          <Button variant="primary" icon="send" loading={busy} loadingLabel="Publicando…" onClick={() => void publish()}>
            Publicar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PostDetail({
  post,
  authors,
  me,
  spaceId,
  channelId,
  canPost,
  canDelete,
  onClose,
  onDeleted,
}: {
  post: ChatMsg;
  authors: Record<string, ChatAuthor>;
  me: ChatAuthor;
  spaceId: string;
  channelId: string;
  canPost: boolean;
  canDelete: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<ChatMsg[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const author = authors[post.author_id];

  useEffect(() => {
    void signedUrls(post.attachments.map((a) => a.path)).then(setUrls);
    let alive = true;
    void getBrowserClient()
      .from("messages")
      .select(CHANNEL_COLUMNS)
      .eq("reply_to", post.id)
      .order("created_at")
      .limit(200)
      .then(({ data }) => alive && setComments(((data ?? []) as unknown as ChatMsg[]).map(toChatMsg)));
    return () => {
      alive = false;
    };
  }, [post]);

  async function comment() {
    const content = text.trim();
    if (!content) return;
    setBusy(true);
    const { data, error } = await getBrowserClient()
      .from("messages")
      .insert({ space_id: spaceId, channel_id: channelId, author_id: me.id, content, reply_to: post.id })
      .select(CHANNEL_COLUMNS)
      .single();
    setBusy(false);
    if (error || !data) return toast.error("Não foi possível comentar.");
    setText("");
    setComments((all) => [...(all ?? []), toChatMsg(data as unknown as ChatMsg)]);
  }

  async function remove() {
    const { error } = await getBrowserClient().from("messages").delete().eq("id", post.id);
    if (error) return toast.error("Não foi possível apagar.");
    toast.success("Publicação apagada");
    onDeleted();
  }

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={author?.display_name ?? "Publicação"}>
      <div className={styles.detail}>
        <div className={styles.detailImages}>
          {post.attachments.map((a) =>
            urls[a.path] ? (
              <a key={a.path} href={urls[a.path]} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urls[a.path]} alt={a.name} />
              </a>
            ) : (
              <Skeleton key={a.path} height={240} style={{ borderRadius: "var(--radius-md)" }} />
            ),
          )}
        </div>
        {post.content && (
          <p className={styles.detailText}>
            <RichText text={post.content} authors={authors} meId={me.id} />
          </p>
        )}
        <p className={styles.detailMeta}>
          {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(post.created_at))} · {post.attachments.length}{" "}
          {post.attachments.length === 1 ? "imagem" : "imagens"} · {formatSize(post.attachments.reduce((n, a) => n + a.size, 0))}
        </p>
        <h3 className={styles.commentsTitle}>Comentários</h3>
        {comments === null ? (
          <div className={styles.commentsLoading}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={14} />
          </div>
        ) : comments.length === 0 ? (
          <p className={styles.detailMeta}>Nenhum comentário ainda.</p>
        ) : (
          <ul className={styles.comments}>
            {comments.map((c) => {
              const who = authors[c.author_id];
              return (
                <li key={c.id}>
                  <Avatar name={who?.display_name ?? "?"} src={who?.avatar_url ?? undefined} color={who?.color} size={28} />
                  <span>
                    <strong>{who?.display_name ?? "Alguém"}</strong> <RichText text={c.content} authors={authors} meId={me.id} />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {canPost && (
          <form
            className={styles.commentForm}
            onSubmit={(e) => {
              e.preventDefault();
              void comment();
            }}
          >
            <input value={text} maxLength={2000} placeholder="Comentar…" aria-label="Comentar" onChange={(e) => setText(e.target.value)} />
            <Button type="submit" icon="send" loading={busy}>
              Enviar
            </Button>
          </form>
        )}
        {canDelete && (
          <Button variant="ghost" icon="trash" onClick={() => void remove()}>
            Apagar publicação
          </Button>
        )}
      </div>
    </Modal>
  );
}
