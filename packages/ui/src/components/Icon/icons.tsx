import type { ReactNode } from "react";

/**
 * Conjunto de ícones do tema Neutro. Grade de 24px, traço de 1.8px, pontas arredondadas, currentColor.
 * Os ícones são pedidos por nome semântico; um tema pronto poderá apontar os mesmos nomes para outros SVGs.
 */
export const icons = {
  // Tipos de canal
  announcement: (
    <>
      <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" />
      <path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12" />
    </>
  ),
  rules: (
    <>
      <path d="M8 4h10a2 2 0 0 1 2 2v1h-4" />
      <path d="M16 7v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1h10" />
      <path d="M8 4a2 2 0 0 0-2 2v11" />
      <path d="M10 9h3M10 13h3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  gallery: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 17l-5-5-9 8" />
    </>
  ),
  voice: (
    <>
      <path d="M4 9h4l5-4v14l-5-4H4z" />
      <path d="M17 9a4 4 0 0 1 0 6" />
    </>
  ),
  dice: (
    <>
      <path d="M12 2l9 5v10l-9 5-9-5V7z" />
      <path d="M12 7l5 8H7z" />
    </>
  ),
  quote: (
    <>
      <path d="M10 7H5v5h5zM10 12c0 3-1.5 5-4.5 6" />
      <path d="M19 7h-5v5h5zM19 12c0 3-1.5 5-4.5 6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  // Compêndio
  claw: <path d="M6 4c2 4 2 10-1 16M12 4c2 4 2 10-1 16M18 4c2 4 2 10-1 16" />,
  sword: (
    <>
      <path d="M21 3v4L10 18l-4-4L17 3z" />
      <path d="M5 13l6 6M7.5 16.5L4 20" />
    </>
  ),
  sparkle: (
    <>
      <path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z" />
      <path d="M19 15v6M16 18h6" />
    </>
  ),
  map: (
    <>
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  flag: <path d="M5 21V4h11l-2 4 2 4H5" />,
  // Sistema (nunca mudam com o tema)
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  micOff: (
    <>
      <path d="M15 10V6a3 3 0 0 0-5.7-1.3M9 9v2a3 3 0 0 0 5 2.2" />
      <path d="M5 11a7 7 0 0 0 11.5 5.4M19 11a7 7 0 0 1-.6 2.8M12 18v3M3 3l18 18" />
    </>
  ),
  wave: <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" />,
  leave: <path d="M3 12c5-4 13-4 18 0l-2 3-4-1v-2a10 10 0 0 0-6 0v2l-4 1z" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </>
  ),
  back: <path d="M15 18l-6-6 6-6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof icons;
