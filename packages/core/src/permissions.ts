// Permissões em bitmask (um inteiro). Os mesmos valores estão no SQL (supabase/migrations) e um teste
// em packages/db confere que o banco e este arquivo resolvem do mesmo jeito.

export const Permission = {
  VIEW_CHANNEL: 1 << 0,
  SEND_MESSAGES: 1 << 1,
  SPEAK: 1 << 2,
  PUBLISH_ANNOUNCEMENTS: 1 << 3,
  MANAGE_MESSAGES: 1 << 4,
  CREATE_INVITES: 1 << 5,
  CREATE_CAMPAIGNS: 1 << 6,
  MANAGE_COMPENDIUM: 1 << 7,
  MANAGE_CHANNELS: 1 << 8,
  MANAGE_ROLES: 1 << 9,
  MANAGE_THEME: 1 << 10,
  KICK_MEMBERS: 1 << 11,
} as const;

export type PermissionName = keyof typeof Permission;

export const ALL_PERMISSIONS = Object.values(Permission).reduce((a, b) => a | b, 0);

export interface Override {
  allow: number;
  deny: number;
}

export interface ChannelPermissionInput {
  isOwner: boolean;
  isMember: boolean;
  /** Permissões de cada cargo da pessoa, incluindo o cargo padrão do Cenário. */
  rolePermissions: number[];
  /** Ajustes da categoria e do canal: dos cargos da pessoa e da própria pessoa. */
  category?: { roles: Override[]; member?: Override };
  channel?: { roles: Override[]; member?: Override };
}

function apply(perms: number, level?: { roles: Override[]; member?: Override }) {
  if (!level) return perms;
  const deny = level.roles.reduce((acc, o) => acc | o.deny, 0);
  const allow = level.roles.reduce((acc, o) => acc | o.allow, 0);
  perms = (perms & ~deny) | allow;
  if (level.member) perms = (perms & ~level.member.deny) | level.member.allow;
  return perms;
}

/**
 * Regra de resolução (ADR 0014), igual à do Discord:
 * 1. O dono tem tudo.
 * 2. Base: soma (OU) das permissões de todos os cargos da pessoa.
 * 3. Categoria, depois canal: em cada nível, aplica o que os cargos negam, depois o que liberam, e por fim o ajuste da própria pessoa.
 * 4. Sem "ver canal", nenhuma outra permissão vale naquele canal.
 */
export function resolveChannelPermissions(input: ChannelPermissionInput): number {
  if (input.isOwner) return ALL_PERMISSIONS;
  if (!input.isMember) return 0;
  let perms = input.rolePermissions.reduce((a, b) => a | b, 0);
  perms = apply(perms, input.category);
  perms = apply(perms, input.channel);
  return perms & Permission.VIEW_CHANNEL ? perms : 0;
}

export const hasPermission = (perms: number, permission: number) => (perms & permission) === permission;
