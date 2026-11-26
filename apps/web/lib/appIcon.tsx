// Ícone do app desenhado em código (dado d20 sobre o dourado da Mesa), para os ícones gerados pelo Next.
export function AppIconArt({ size }: { size: number }) {
  const s = size;
  return (
    <div style={{ width: s, height: s, display: "flex", alignItems: "center", justifyContent: "center", background: "#d4a24c", borderRadius: s * 0.22 }}>
      <svg width={s * 0.62} height={s * 0.62} viewBox="0 0 24 24" fill="none" stroke="#1a1408" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l9 5v10l-9 5-9-5V7z" />
        <path d="M12 7l5 8H7z" />
      </svg>
    </div>
  );
}

/** O mesmo ícone em SVG, embutido como data URI (favicon do export estático). */
export const APP_ICON_SVG_DATA_URI = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#d4a24c"/>' +
    '<g transform="translate(6 6) scale(0.833)" fill="none" stroke="#1a1408" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 7l5 8H7z"/></g></svg>',
)}`;
