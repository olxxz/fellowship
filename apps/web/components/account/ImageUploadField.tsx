"use client";

import { Button, cx, toast } from "@fellowship/ui";
import { useId, useRef, useState, type ReactNode } from "react";
import { prepareImage, uploadPublic, type CropRect, type ImageShape } from "@/lib/upload";
import { CropDialog } from "./CropDialog";
import styles from "./Settings.module.sass";

/**
 * Campo de imagem (avatar, ícone ou banner): escolhe, recorta/reduz no navegador, sobe e grava o endereço
 * num input escondido do formulário. "Remover" volta para o placeholder gerado.
 */
export function ImageUploadField({
  label,
  name,
  value,
  onChange,
  shape,
  bucket,
  folder,
  help,
  round,
  preview,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (url: string) => void;
  shape: ImageShape;
  bucket: "perfis" | "cenarios";
  folder: string;
  help?: string;
  /** Moldura redonda no editor de corte (avatar). */
  round?: boolean;
  /** Como fica (avatar redondo, banner largo…), recebendo o endereço atual. */
  preview: (url: string) => ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const id = useId();

  const [editing, setEditing] = useState<{ file: File; url: string } | null>(null);

  // Imagem escolhida: abre o editor de corte. GIF sobe direto (cortar perderia a animação).
  function pick(file: File | undefined) {
    if (input.current) input.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Escolha uma imagem (JPG, PNG, WebP ou GIF).");
    if (file.type === "image/gif") return void upload(file);
    setEditing({ file, url: URL.createObjectURL(file) });
  }

  async function upload(file: File, crop?: CropRect) {
    setBusy(true);
    try {
      const blob = await prepareImage(file, shape, crop);
      onChange(await uploadPublic(bucket, folder, name.replace(/_url$/, ""), blob));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar a imagem.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.field}>
      <span className={styles.label} id={`${id}-l`}>
        {label}
      </span>
      <div className={cx(styles.imageField, shape === "banner" && styles.imageFieldBanner)}>
        {preview(value)}
        <div className={styles.actions}>
          <Button icon="plus" loading={busy} loadingLabel="Enviando…" onClick={() => input.current?.click()} aria-describedby={`${id}-l`}>
            {value ? "Trocar" : "Enviar imagem"}
          </Button>
          {value && !busy && (
            <Button variant="ghost" onClick={() => onChange("")}>
              Remover
            </Button>
          )}
        </div>
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <input type="hidden" name={name} value={value} />
      {editing && (
        <CropDialog
          src={editing.url}
          shape={shape}
          round={round}
          title={`Ajustar ${label.toLowerCase()}`}
          onCancel={() => {
            URL.revokeObjectURL(editing.url);
            setEditing(null);
          }}
          onConfirm={(crop) => {
            const file = editing.file;
            URL.revokeObjectURL(editing.url);
            setEditing(null);
            void upload(file, crop);
          }}
        />
      )}
      {help && <span className={styles.help}>{help}</span>}
    </div>
  );
}
