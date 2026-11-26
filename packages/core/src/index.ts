// Regras de domínio compartilhadas entre web, desktop e mobile: tipos, ficha, fórmulas, permissões.
// Ainda vazio além dos enums do modelo de domínio; ver docs/especificacao.md, seção "Modelo de domínio".

/** Toda mensagem, nota e entrada de memória é ingame ou outgame. */
export const SCOPES = ["ingame", "outgame"] as const;
export type Scope = (typeof SCOPES)[number];

/** privado: só o autor · mestre: autor + mestre · grupo: todos da campanha · personagens: lista específica. */
export const VISIBILITIES = ["privado", "mestre", "grupo", "personagens"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const CHANNEL_TYPES = ["texto", "anuncios", "galeria", "voz", "voz_dinamica", "funcional"] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

export const CAMPAIGN_ROLES = ["mestre", "jogador", "espectador"] as const;
export type CampaignRole = (typeof CAMPAIGN_ROLES)[number];

export * from "./permissions";
