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
}

export interface Message {
  id: string;
  space_id: string;
  channel_id: string;
  author_id: string;
  scope: "ingame" | "outgame";
  kind: "texto" | "rolagem" | "sistema";
  content: string;
  created_at: string;
  attachments?: Attachment[];
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
