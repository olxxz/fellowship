// Tipos do banco. Por enquanto escritos à mão a partir de supabase/migrations;
// depois, gerados com `supabase gen types typescript`.

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  /** Cor livre em hex (#rrggbb). */
  color: string;
  bio: string | null;
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
  member_count: number;
  inviter: string;
  status: InviteStatus;
  already_member: boolean;
}
