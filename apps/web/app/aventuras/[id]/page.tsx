import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdventurePlayer } from "@/components/adventure/AdventurePlayer";
import { adventureById, adventures } from "@/lib/adventures";

type Params = Promise<{ id: string }>;

export const dynamicParams = false;
export const generateStaticParams = () => adventures.map((a) => ({ id: a.id }));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const a = adventureById((await params).id);
  return a ? { title: a.titulo, description: a.resumo } : {};
}

export default async function AdventurePage({ params }: { params: Params }) {
  const a = adventureById((await params).id);
  if (!a) notFound();
  return <AdventurePlayer adventure={a} />;
}
