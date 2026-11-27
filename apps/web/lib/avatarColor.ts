"use client";

/**
 * Cor de fundo de uma foto de perfil: média dos pixels da borda (onde costuma estar o fundo).
 * Serve para a cor do perfil combinar com o avatar (ex.: o círculo colorido que o Google gera).
 * Se a imagem não permitir leitura (CORS), devolve null.
 */
export async function avatarColor(src: string): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    await img.decode();
    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    let r = 0,
      g = 0,
      b = 0,
      n = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Anel perto da borda, mas dentro do círculo (fotos redondas têm cantos transparentes).
        const dx = x - size / 2 + 0.5;
        const dy = y - size / 2 + 0.5;
        const dist = Math.hypot(dx, dy);
        if (dist < size * 0.36 || dist > size * 0.48) continue;
        const i = (y * size + x) * 4;
        if (data[i + 3]! < 200) continue;
        r += data[i]!;
        g += data[i + 1]!;
        b += data[i + 2]!;
        n++;
      }
    }
    if (!n) return null;
    const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  } catch {
    return null;
  }
}
