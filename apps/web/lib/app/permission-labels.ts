import { Permission, type PermissionName } from "@fellowship/core";

/** Nome e explicação de cada permissão, na ordem em que aparecem nas telas. */
export const PERMISSION_LABELS: Array<{ key: PermissionName; label: string; help: string }> = [
  { key: "VIEW_CHANNEL", label: "Ver canais", help: "Ver os canais e ler as mensagens." },
  { key: "SEND_MESSAGES", label: "Enviar mensagens", help: "Escrever nos canais de texto." },
  { key: "SPEAK", label: "Falar na voz", help: "Ligar microfone, câmera e tela nas salas de voz." },
  { key: "PUBLISH_ANNOUNCEMENTS", label: "Publicar anúncios", help: "Escrever nos canais de anúncios." },
  { key: "MANAGE_MESSAGES", label: "Gerenciar mensagens", help: "Apagar mensagens de outras pessoas." },
  { key: "CREATE_INVITES", label: "Criar convites", help: "Gerar links de convite." },
  { key: "CREATE_CAMPAIGNS", label: "Criar campanhas", help: "Abrir campanhas novas (fase 1)." },
  { key: "MANAGE_COMPENDIUM", label: "Gerenciar compêndio", help: "Editar o compêndio do Cenário (fase 1)." },
  { key: "MANAGE_CHANNELS", label: "Gerenciar canais", help: "Criar, editar, reordenar e apagar canais e categorias." },
  { key: "MANAGE_ROLES", label: "Gerenciar cargos", help: "Criar e editar cargos abaixo do seu e dar cargos a membros." },
  { key: "MANAGE_THEME", label: "Gerenciar o Cenário", help: "Nome, cor, imagens, figurinhas e público/privado." },
  { key: "KICK_MEMBERS", label: "Expulsar membros", help: "Tirar do Cenário quem tem cargo abaixo do seu." },
];

/** Permissões que fazem sentido ajustar por canal. */
export const CHANNEL_PERMISSIONS: PermissionName[] = ["VIEW_CHANNEL", "SEND_MESSAGES", "SPEAK", "PUBLISH_ANNOUNCEMENTS", "MANAGE_MESSAGES"];

export { Permission };
