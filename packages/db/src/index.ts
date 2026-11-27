// Tipos do banco. Por enquanto escritos à mão a partir de supabase/migrations;
// depois, gerados com `supabase gen types typescript`.

export interface Profile {
  id: string;
  display_name: string;
  /** Nick único (@usuario): 3 a 20 caracteres a-z, 0-9, ponto e sublinhado. */
  username: string;
  avatar_url: string | null;
  /** Banner do perfil (imagem pública no bucket "perfis"). */
  banner_url?: string | null;
  /** Cor livre em hex (#rrggbb). */
  color: string;
  bio: string | null;
  /** Já passou pelas boas-vindas (escolheu o nick). */
  onboarded?: boolean;
}

/** Relação entre a conta logada e outra pessoa. */
export type FriendshipState = "voce" | "amigos" | "enviado" | "recebido" | "nenhuma";

/** Cartão público de alguém, achado pelo nick (find_profile). */
export interface ProfileCard extends Profile {
  friendship: FriendshipState;
}

export interface Friendship {
  user_a: string;
  user_b: string;
  requested_by: string;
  status: "pendente" | "aceita";
  created_at: string;
}

/** Arquivo anexado a uma mensagem (caminho no bucket privado "anexos"). */
export interface Attachment {
  path: string;
  name: string;
  size: number;
  mime: string;
  width?: number;
  height?: number;
}

export interface DirectMessage {
  id: string;
  user_a: string;
  user_b: string;
  author_id: string;
  content: string;
  created_at: string;
  kind?: "texto" | "figurinha";
  edited_at?: string | null;
  reply_to?: string | null;
  attachments?: Attachment[];
}

/** Cenário público listado em Explorar. */
export interface PublicSpace {
  id: string;
  name: string;
  short: string;
  description: string | null;
  color: string;
  icon_url: string | null;
  banner_url: string | null;
  member_count: number;
  is_member: boolean;
}

export interface Space {
  id: string;
  kind: "cenario" | "comunidade";
  name: string;
  short: string;
  description: string | null;
  /** Cor livre em hex (#rrggbb). */
  color: string;
  owner_id: string;
  /** Público: aparece em Explorar e qualquer conta entra sem convite. */
  is_public: boolean;
  icon_url?: string | null;
  banner_url?: string | null;
}

export interface Role {
  id: string;
  space_id: string;
  name: string;
  color: number | null;
  position: number;
  permissions: number;
  is_default: boolean;
  granted_on_join: boolean;
}

export interface Category {
  id: string;
  space_id: string;
  name: string;
  position: number;
}

export type ChannelKind = "texto" | "anuncios" | "galeria" | "voz" | "voz_dinamica" | "funcional";

export interface Channel {
  id: string;
  space_id: string;
  category_id: string | null;
  kind: ChannelKind;
  name: string;
  topic: string | null;
  icon: string | null;
  position: number;
  /** Canal de uma campanha (só quem joga vê). */
  campaign_id?: string | null;
}

export type CampaignSystem = "homebrew" | "dnd2024";
export type CampaignRole = "mestre" | "jogador" | "espectador";

export interface Campaign {
  id: string;
  space_id: string;
  name: string;
  description: string | null;
  color: string;
  banner_url: string | null;
  system: CampaignSystem;
  open_to_join: boolean;
  position: number;
  created_by: string | null;
}

export interface CampaignMember {
  campaign_id: string;
  user_id: string;
  role: CampaignRole;
}

export type SheetTemplate = CampaignSystem;

export interface Character {
  id: string;
  campaign_id: string;
  owner_id: string | null;
  kind: "pc" | "npc";
  name: string;
  portrait_url: string | null;
  color: string;
  template: SheetTemplate;
  sheet: Record<string, unknown>;
  revealed: boolean;
  updated_at: string;
}

/** Conteúdo de uma mensagem de rolagem (JSON em messages.content, gravado pelo servidor). */
export interface RollPayload {
  formula: string;
  label?: string;
  total: number;
  modifier: number;
  dice: Array<{ value: number; sides: number; discarded?: boolean }>;
  critical?: { kind: "success" | "failure"; label: string };
  character?: { id: string; name: string; color: string; portrait_url: string | null };
}

export interface Message {
  id: string;
  space_id: string;
  channel_id: string;
  author_id: string;
  scope: "ingame" | "outgame";
  kind: "texto" | "rolagem" | "sistema" | "figurinha";
  content: string;
  created_at: string;
  edited_at?: string | null;
  reply_to?: string | null;
  mentions?: string[];
  attachments?: Attachment[];
}

export interface Reaction {
  message_id: string;
  user_id: string;
  emoji: string;
}

/** Figurinha do Cenário (imagem pública no bucket "cenarios"). */
export interface Sticker {
  id: string;
  space_id: string;
  name: string;
  url: string;
}

export type ChannelTemplate = "padrao" | "vazio";

export interface Invite {
  code: string;
  space_id: string;
  created_by: string;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export type InviteStatus = "valido" | "expirado" | "esgotado" | "revogado";

export interface InvitePreview {
  space_id: string;
  name: string;
  short: string;
  description: string | null;
  color: string;
  icon_url: string | null;
  banner_url: string | null;
  member_count: number;
  inviter: string;
  status: InviteStatus;
  already_member: boolean;
}
