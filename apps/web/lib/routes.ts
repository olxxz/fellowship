export const spaceHref = (space: string, channel: string) => `/s/${space}/${channel}`;
export const campaignHref = (space: string, campaign: string, channel?: string) =>
  channel && channel !== "mesa" ? `/s/${space}/campanha/${campaign}/${channel}` : `/s/${space}/campanha/${campaign}`;
