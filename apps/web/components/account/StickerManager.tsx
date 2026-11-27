"use client";

import { Button, IconButton } from "@fellowship/ui";
import type { Sticker } from "@fellowship/db";
import { useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { prepareImage, uploadPublic } from "@/lib/upload";
import styles from "./Settings.module.sass";

/** Figurinhas do Cenário: quem gerencia o tema sobe (PNG, WebP ou GIF animado) e apaga. */
export function StickerManager({ spaceId, meId, initial }: { spaceId: string; meId: string; initial: Sticker[] }) {
  const [stickers, setStickers] = useState(initial);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  async function add(f: File | undefined) {
    if (!f) return;
    const label = name.trim() || f.name.replace(/\.[^.]+$/, "").slice(0, 32);
    setBusy(true);
    setError(null);
    try {
      const url = await uploadPublic("cenarios", `${spaceId}/figurinhas`, "figurinha", await prepareImage(f, "square"));
      const { data, error: err } = await getBrowserClient()
        .from("stickers")
        .insert({ space_id: spaceId, name: label, url, created_by: meId })
        .select("id, space_id, name, url")
        .single<Sticker>();
      if (err || !data) throw new Error("Não foi possível salvar a figurinha.");
      setStickers((all) => [...all, data]);
      setName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível enviar.");
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }

  async function remove(s: Sticker) {
    setStickers((all) => all.filter((x) => x.id !== s.id));
    const supabase = getBrowserClient();
    const { error: err } = await supabase.from("stickers").delete().eq("id", s.id);
    if (err) return setStickers((all) => [...all, s]);
    const path = s.url.split("/object/public/cenarios/")[1];
    if (path) void supabase.storage.from("cenarios").remove([decodeURIComponent(path)]);
  }

  return (
    <div className={styles.dialogSection}>
      <div className={styles.inlineForm}>
        <input className={styles.input} value={name} maxLength={32} placeholder="Nome (opcional)" aria-label="Nome da figurinha" onChange={(e) => setName(e.target.value)} />
        <Button icon="plus" loading={busy} loadingLabel="Enviando…" onClick={() => file.current?.click()}>
          Adicionar figurinha
        </Button>
        <input ref={file} type="file" accept="image/png,image/webp,image/gif,image/jpeg" hidden onChange={(e) => void add(e.target.files?.[0])} />
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {stickers.length === 0 ? (
        <p className={styles.help}>Nenhuma figurinha ainda. PNG com fundo transparente ou GIF animado ficam melhores (até 4 MB).</p>
      ) : (
        <ul className={styles.stickerList}>
          {stickers.map((s) => (
            <li key={s.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt="" />
              <span className={styles.help}>{s.name}</span>
              <IconButton icon="close" label={`Apagar ${s.name}`} variant="ghost" onClick={() => void remove(s)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
