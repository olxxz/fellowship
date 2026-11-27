"use client";

import type { Attachment } from "@fellowship/db";
import { getBrowserClient } from "@/lib/supabase/client";

// Upload no navegador (ADR 0016): imagens são recortadas, reduzidas e convertidas antes de subir (isso também
// tira os metadados da foto, como localização). GIF sobe como está, para continuar animado.

export type ImageShape = "square" | "banner";

const SHAPES: Record<ImageShape, { w: number; h: number }> = { square: { w: 512, h: 512 }, banner: { w: 1800, h: 600 } };
const MAX_PUBLIC = 4 * 1024 * 1024;
export const MAX_ATTACHMENT = 25 * 1024 * 1024;

async function encode(canvas: HTMLCanvasElement, quality = 0.86): Promise<Blob> {
  const toBlob = (type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, quality));
  // Safari antigo não gera WebP: cai para JPEG.
  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") return webp;
  return (await toBlob("image/jpeg"))!;
}

const ext = (mime: string) => (mime === "image/webp" ? "webp" : mime === "image/gif" ? "gif" : mime === "image/png" ? "png" : "jpg");

/** Recorta no centro na proporção pedida e reduz (avatar/ícone 512×512, banner 1800×600). */
export async function prepareImage(file: File, shape: ImageShape): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Escolha uma imagem (JPG, PNG, WebP ou GIF).");
  if (file.type === "image/gif") {
    if (file.size > MAX_PUBLIC) throw new Error("GIF de até 4 MB.");
    return file;
  }
  const bitmap = await createImageBitmap(file);
  const target = SHAPES[shape];
  const ratio = target.w / target.h;
  let sw = bitmap.width;
  let sh = sw / ratio;
  if (sh > bitmap.height) {
    sh = bitmap.height;
    sw = sh * ratio;
  }
  const scale = Math.min(1, target.w / sw);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  canvas.getContext("2d")!.drawImage(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await encode(canvas);
  if (blob.size > MAX_PUBLIC) throw new Error("A imagem ficou grande demais. Tente outra.");
  return blob;
}

/** Sobe para um bucket público e devolve o endereço da imagem. */
export async function uploadPublic(bucket: "perfis" | "cenarios", folder: string, name: string, blob: Blob) {
  const supabase = getBrowserClient();
  const path = `${folder}/${name}-${crypto.randomUUID().slice(0, 8)}.${ext(blob.type)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(error.message.includes("row-level security") ? "Você não tem permissão para trocar esta imagem." : "Não foi possível enviar a imagem agora.");
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Imagem de anexo: reduz fotos grandes (até 2560 px, WebP); GIF e outros arquivos sobem como estão. */
async function prepareAttachment(file: File): Promise<{ blob: Blob; width?: number; height?: number }> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    if (file.size > MAX_ATTACHMENT) throw new Error(`${file.name}: arquivos de até 25 MB.`);
    if (file.type === "image/gif") {
      const bitmap = await createImageBitmap(file).catch(() => null);
      const size = bitmap ? { width: bitmap.width, height: bitmap.height } : {};
      bitmap?.close();
      return { blob: file, ...size };
    }
    return { blob: file };
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2560 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await encode(canvas, 0.88);
  return { blob: blob.size < file.size ? blob : file, width: canvas.width, height: canvas.height };
}

const safeName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w.-]+/g, "_")
    .slice(-80) || "arquivo";

/** Sobe um anexo em anexos/<prefixo>/<uuid>/<nome> (c/<canal> ou d/<a>_<b>). */
export async function uploadAttachment(prefix: string, file: File): Promise<Attachment> {
  const { blob, width, height } = await prepareAttachment(file);
  const name = blob === file ? file.name : file.name.replace(/\.[^.]+$/, "") + `.${ext(blob.type)}`;
  const path = `${prefix}/${crypto.randomUUID()}/${safeName(name)}`;
  const { error } = await getBrowserClient().storage.from("anexos").upload(path, blob, { contentType: blob.type || "application/octet-stream", upsert: false });
  if (error) throw new Error(error.message.includes("row-level security") ? "Você não pode enviar arquivos aqui." : `Não foi possível enviar ${file.name}.`);
  return { path, name, size: blob.size, mime: blob.type || "application/octet-stream", ...(width ? { width, height } : {}) };
}

// Endereços assinados dos anexos (privados): 1 hora, guardados em memória para não pedir de novo a cada render.
const signed = new Map<string, { url: string; until: number }>();

export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  const now = Date.now();
  const missing = paths.filter((p) => !signed.has(p) || signed.get(p)!.until < now + 60_000);
  if (missing.length) {
    const { data } = await getBrowserClient().storage.from("anexos").createSignedUrls(missing, 3600);
    for (const item of data ?? []) if (item.signedUrl && item.path) signed.set(item.path, { url: item.signedUrl, until: now + 3600_000 });
  }
  return Object.fromEntries(paths.filter((p) => signed.has(p)).map((p) => [p, signed.get(p)!.url]));
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}
