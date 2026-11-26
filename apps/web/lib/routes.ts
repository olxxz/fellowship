// Protótipo com dados de exemplo (estático, também no GitHub Pages).
export const spaceHref = (space: string, channel: string) => `/demo/s/${space}/${channel}`;
export const campaignHref = (space: string, campaign: string, channel?: string) =>
  channel && channel !== "mesa" ? `/demo/s/${space}/campanha/${campaign}/${channel}` : `/demo/s/${space}/campanha/${campaign}`;
export const demoHomeHref = "/demo/inicio";

// App real (precisa de servidor e login).
export const appSpaceHref = (spaceId: string, channelId?: string) => (channelId ? `/c/${spaceId}/${channelId}` : `/c/${spaceId}`);
export const appHomeHref = "/inicio";
export const createSpaceHref = "/criar-cenario";
export const exploreHref = "/explorar";
export const friendsHref = "/amigos";
export const myProfileHref = "/perfil";
export const editProfileHref = "/conta";
export const userHref = (username: string) => `/u/${username}`;
export const dmHref = (username: string) => `/mensagens/${username}`;
/** Link de amizade e de convite para o app: quem abre cria conta (se precisar) e já pede amizade. */
export const friendLinkHref = (username: string) => `/amigo/${username}`;
