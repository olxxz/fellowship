"use client";

import { Avatar, Icon, IconButton, Popover } from "@fellowship/ui";
import type { Sticker } from "@fellowship/db";
import { useEffect, useId, useMemo, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from "react";
import type { ChatAuthor } from "@/lib/chat/source";
import { formatSize, MAX_ATTACHMENT } from "@/lib/upload";
import { EmojiPicker } from "./EmojiPicker";
import styles from "./ChatRoom.module.sass";

interface Draft {
  id: string;
  file: File;
  preview?: string;
}

export interface ComposerProps {
  placeholder: string;
  authors: Record<string, ChatAuthor>;
  meId: string;
  stickers: Sticker[];
  replyTo: { name: string; text: string } | null;
  onCancelReply: () => void;
  /** Envia texto e arquivos; resolve quando gravou (ou rejeita com a mensagem de erro). */
  onSend: (text: string, files: File[]) => Promise<void>;
  onSticker: (sticker: Sticker) => void;
  /** Seta para cima com o campo vazio: editar a última mensagem própria. */
  onEditLast: () => void;
}

export function Composer({ placeholder, authors, meId, stickers, replyTo, onCancelReply, onSend, onSticker, onEditLast }: ComposerProps) {
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mention, setMention] = useState<{ query: string; start: number; index: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const hintId = useId();

  useEffect(() => {
    if (replyTo) input.current?.focus();
  }, [replyTo]);
  // Libera as prévias locais das imagens ao tirar ou enviar.
  useEffect(() => () => drafts.forEach((d) => d.preview && URL.revokeObjectURL(d.preview)), [drafts]);

  const candidates = useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    return Object.values(authors)
      .filter((a) => a.id !== meId && (a.username.startsWith(q) || a.display_name.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [mention, authors, meId]);

  function addFiles(list: FileList | File[]) {
    const files = [...list];
    const tooBig = files.find((f) => f.size > MAX_ATTACHMENT);
    if (tooBig) setError(`${tooBig.name} passa de 25 MB.`);
    const ok = files.filter((f) => f.size <= MAX_ATTACHMENT).slice(0, 10 - drafts.length);
    setDrafts((d) => [...d, ...ok.map((file) => ({ id: crypto.randomUUID(), file, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined }))]);
    input.current?.focus();
  }

  function resize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  function onChange(value: string, caret: number) {
    setText(value);
    const before = value.slice(0, caret);
    const m = before.match(/(^|\s)@([a-z0-9_.]{0,20})$/i);
    setMention(m ? { query: m[2]!, start: caret - m[2]!.length - 1, index: 0 } : null);
  }

  function pickMention(a: ChatAuthor) {
    if (!mention) return;
    const el = input.current!;
    const caret = el.selectionStart;
    const next = `${text.slice(0, mention.start)}@${a.username} ${text.slice(caret)}`;
    setText(next);
    setMention(null);
    requestAnimationFrame(() => {
      const pos = mention.start + a.username.length + 2;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  function insertAtCaret(value: string) {
    const el = input.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    setText(text.slice(0, start) + value + text.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + value.length, start + value.length);
    });
  }

  async function send() {
    const content = text.trim();
    if ((!content && drafts.length === 0) || sending) return;
    if (content.length > 4000) return setError("A mensagem passou de 4000 caracteres.");
    setSending(true);
    setError(null);
    try {
      await onSend(content, drafts.map((d) => d.file));
      setText("");
      setDrafts([]);
      if (input.current) input.current.style.height = "auto";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível enviar. Confira a conexão e tente de novo.");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (mention && candidates.length) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const d = e.key === "ArrowDown" ? 1 : -1;
        setMention({ ...mention, index: (mention.index + d + candidates.length) % candidates.length });
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pickMention(candidates[mention.index]!);
        return;
      }
      if (e.key === "Escape") return setMention(null);
    }
    if (e.key === "Escape" && replyTo) return onCancelReply();
    if (e.key === "ArrowUp" && !text) {
      e.preventDefault();
      onEditLast();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const files = [...e.clipboardData.files];
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  }

  const dropHandlers = {
    onDragOver: (e: DragEvent) => {
      if (e.dataTransfer.types.includes("Files")) {
        e.preventDefault();
        setDragging(true);
      }
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
  };

  return (
    <div className={styles.composer} {...dropHandlers}>
      {replyTo && (
        <div className={styles.replyBar}>
          <Icon name="reply" size={14} />
          <span>
            Respondendo a <strong>{replyTo.name}</strong>: {replyTo.text}
          </span>
          <IconButton icon="close" label="Cancelar resposta" variant="ghost" onClick={onCancelReply} />
        </div>
      )}
      {drafts.length > 0 && (
        <ul className={styles.tray} aria-label="Arquivos para enviar">
          {drafts.map((d) => (
            <li key={d.id} className={styles.trayItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {d.preview ? <img src={d.preview} alt="" /> : <Icon name="sheet" size={22} />}
              <span className={styles.trayName}>{d.file.name}</span>
              <span className={styles.fileSize}>{formatSize(d.file.size)}</span>
              <button type="button" className={styles.trayRemove} aria-label={`Tirar ${d.file.name}`} onClick={() => setDrafts((all) => all.filter((x) => x.id !== d.id))}>
                <Icon name="close" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={`${styles.box} ${dragging ? styles.boxDragging : ""}`}>
        <button type="button" className={styles.toolButton} aria-label="Anexar arquivos" title="Anexar arquivos" onClick={() => fileInput.current?.click()}>
          <Icon name="paperclip" size={20} />
        </button>
        <input ref={fileInput} type="file" multiple hidden onChange={(e) => e.target.files && (addFiles(e.target.files), (e.target.value = ""))} />
        <div className={styles.inputWrap}>
          {mention && candidates.length > 0 && (
            <ul className={styles.mentionList} role="listbox" aria-label="Mencionar">
              {candidates.map((a, i) => (
                <li key={a.id} role="option" aria-selected={i === mention.index}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pickMention(a)}>
                    <Avatar name={a.display_name} src={a.avatar_url ?? undefined} color={a.color} size={24} />
                    <span>{a.display_name}</span>
                    <span className={styles.fileSize}>@{a.username}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <textarea
            ref={input}
            className={styles.input}
            rows={1}
            value={text}
            placeholder={placeholder}
            aria-label={placeholder}
            aria-describedby={hintId}
            aria-invalid={error ? true : undefined}
            maxLength={4000}
            onChange={(e) => {
              onChange(e.target.value, e.target.selectionStart);
              resize(e.target);
            }}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
          />
        </div>
        {stickers.length > 0 && (
          <Popover.Root>
            <Popover.Trigger className={styles.toolButton} aria-label="Figurinhas" title="Figurinhas">
              <Icon name="gallery" size={18} />
            </Popover.Trigger>
            <Popover.Popup side="top" align="end" title="Figurinhas">
              <div className={styles.stickerGrid}>
                {stickers.map((s) => (
                  <Popover.Close key={s.id} className={styles.stickerCell} onClick={() => onSticker(s)} aria-label={s.name} title={s.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.url} alt="" loading="lazy" />
                  </Popover.Close>
                ))}
              </div>
            </Popover.Popup>
          </Popover.Root>
        )}
        <EmojiPicker label="Emoji" onPick={insertAtCaret} />
        <IconButton
          icon="send"
          label="Enviar"
          variant={text.trim() || drafts.length ? "primary" : "secondary"}
          loading={sending}
          onClick={() => void send()}
        />
      </div>
      {error ? (
        <p className={styles.error} id={hintId} role="alert">
          {error}
        </p>
      ) : (
        <p className={styles.hint} id={hintId}>
          Enter envia · Shift+Enter quebra a linha · @ menciona · cole ou arraste arquivos
        </p>
      )}
    </div>
  );
}
