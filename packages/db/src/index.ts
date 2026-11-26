// Tipos do banco. Por enquanto escritos à mão a partir de supabase/migrations;
// depois, gerados com `supabase gen types typescript`.

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  color: number;
  bio: string | null;
}

export interface Space {
  id: string;
  kind: "cenario" | "comunidade";
  name: string;
  short: string;
  description: string | null;
  color: number;
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
