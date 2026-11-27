"use client";

import { Icon, Modal } from "@fellowship/ui";
import type { Attachment } from "@fellowship/db";
import { useEffect, useState } from "react";
import { formatSize, signedUrls } from "@/lib/upload";
import styles from "./ChatRoom.module.sass";

/** Anexos de uma mensagem: imagens (e GIFs) em grade, com ampliação; outros arquivos como cartão de download. */
export function MessageAttachments({ items }: { items: Attachment[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Attachment | null>(null);

  useEffect(() => {
    let alive = true;
    void signedUrls(items.map((a) => a.path)).then((u) => alive && setUrls(u));
    return () => {
      alive = false;
    };
  }, [items]);

  const images = items.filter((a) => a.mime.startsWith("image/"));
  const files = items.filter((a) => !a.mime.startsWith("image/"));
  return (
    <div className={styles.attachments}>
      {images.length > 0 && (
        <div className={images.length === 1 ? styles.imageSingle : styles.imageGrid}>
          {images.map((a) => (
            <button key={a.path} type="button" className={styles.imageButton} onClick={() => setOpen(a)} aria-label={`Ampliar ${a.name}`}>
              {urls[a.path] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urls[a.path]} alt={a.name} width={a.width} height={a.height} loading="lazy" />
              ) : (
                <span className={styles.imagePlaceholder} style={a.width && a.height ? { aspectRatio: `${a.width} / ${a.height}` } : undefined} />
              )}
            </button>
          ))}
        </div>
      )}
      {files.map((a) => (
        <a key={a.path} className={styles.fileCard} href={urls[a.path]} target="_blank" rel="noreferrer" download={a.name}>
          <Icon name="sheet" size={22} />
          <span className={styles.fileText}>
            <span className={styles.fileName}>{a.name}</span>
            <span className={styles.fileSize}>{formatSize(a.size)}</span>
          </span>
          <Icon name="link" size={16} />
        </a>
      ))}
      <Modal open={!!open} onOpenChange={(o) => !o && setOpen(null)} title={open?.name ?? ""}>
        {open && urls[open.path] && (
          <div className={styles.lightbox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urls[open.path]} alt={open.name} />
            <a href={urls[open.path]} target="_blank" rel="noreferrer" download={open.name}>
              Abrir original
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}
