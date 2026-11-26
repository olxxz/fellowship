// Protótipo com dados de exemplo (estático, também no GitHub Pages).
export const spaceHref = (space: string, channel: string) => `/demo/s/${space}/${channel}`;
export const campaignHref = (space: string, campaign: string, channel?: string) =>
  channel && channel !== "mesa" ? `/demo/s/${space}/campanha/${campaign}/${channel}` : `/demo/s/${space}/campanha/${campaign}`;
export const demoHomeHref = "/demo/inicio";

// App real (precisa de servidor e login).
export const appSpaceHref = (spaceId: string, channelId?: string) => (channelId ? `/c/${spaceId}/${channelId}` : `/c/${spaceId}`);
export const appHomeHref = "/inicio";
export const createSpaceHref = "/criar-cenario";
