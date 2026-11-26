import type { ReactNode } from "react";

/**
 * Conjunto de ícones do tema Neutro. Grade de 24px, traço de 1.8px, pontas arredondadas, currentColor.
 * Os ícones são pedidos por nome semântico; um tema pronto poderá apontar os mesmos nomes para outros SVGs.
 */
export const icons = {
  // Tipos de canal
  // Megafone: anúncios.
  announcement: (
    <>
      <path d="M4 10v4a1 1 0 0 0 1 1h2l10 5V4L7 9H5a1 1 0 0 0-1 1z" />
      <path d="m7.5 15 1.5 5h2.5l-1.4-4.4" />
      <path d="M20 10a2.5 2.5 0 0 1 0 4" />
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
  // Três riscos de garra na diagonal.
  claw: <path d="M4 11c2.5-1.5 5-4.5 6.5-8M5 17c4-2 8.5-6.5 11-11M10 21c3.5-2 7-6 9.5-10.5" />,
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
  shield: <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z" />,
  bow: (
    <>
      <path d="M6 3c6 3 9 7 9 9s-3 6-9 9" />
      <path d="M6 3v18M15 12h6M18 9l3 3-3 3" />
    </>
  ),
  dagger: (
    <>
      <path d="M14 4l6 0 0 6-8 8-4-4z" />
      <path d="M6 12l6 6M7.5 16.5 4 20" />
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
  // Uma linha por barra, para cada uma poder se mexer sozinha (motion="wave").
  wave: (
    <>
      <path d="M4 10v4" />
      <path d="M8 7v10" />
      <path d="M12 4v16" />
      <path d="M16 7v10" />
      <path d="M20 10v4" />
    </>
  ),
  spinner: (
    <>
      <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </>
  ),
  leave: <path d="M3 12c5-4 13-4 18 0l-2 3-4-1v-2a10 10 0 0 0-6 0v2l-4 1z" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" />
    </>
  ),
  send: <path d="M4 12 20 4l-4 16-4-7zM12 13l8-9" />,
  screen: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10.5 21 7v10l-5-3.5" />
    </>
  ),
  cameraOff: (
    <>
      <path d="M16 13v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1M10 6h4a2 2 0 0 1 2 2v2.5L21 7v10" />
      <path d="M3 3l18 18" />
    </>
  ),
  fullscreen: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  home: <path d="M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
  book: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z" />
      <path d="M4 20a2 2 0 0 0 2 1h13v-3" />
    </>
  ),
  sheet: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5M9 12h7M9 16h7" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  check: <path d="M5 12.5 10 17l9-10" />,
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  userPlus: (
    <>
      <circle cx="10" cy="8" r="4" />
      <path d="M3 20a7 7 0 0 1 14 0M19 8v6M16 11h6" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  back: <path d="M15 18l-6-6 6-6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof icons;
