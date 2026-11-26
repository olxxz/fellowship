import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SpaceChannelView } from "@/components/channel/SpaceChannelView";
import { channelById, spaceById, spaces } from "@/lib/demo/data";

type Params = Promise<{ space: string; channel: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return spaces.flatMap((s) => s.channels.map((c) => ({ space: s.id, channel: c.id })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { space, channel } = await params;
  const s = spaceById(space);
  const c = s && channelById(s, channel);
  return { title: c && s ? `${c.name} · ${s.name}` : "Canal" };
}

export default async function ChannelPage({ params }: { params: Params }) {
  const { space, channel } = await params;
  const s = spaceById(space);
  if (!s || !channelById(s, channel)) notFound();
  return <SpaceChannelView spaceId={space} channelId={channel} />;
}
