import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdventurePlayer } from "@/components/adventure/AdventurePlayer";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { adventureById } from "@/lib/adventures";

type Params = Promise<{ adventure: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const a = adventureById((await params).adventure);
  return a ? { title: a.titulo } : {};
}

/** A história, dentro da casca do app (a aventura aparece na barra de Cenários). */
export default async function AppAdventurePage({ params }: { params: Params }) {
  const a = adventureById((await params).adventure);
  if (!a) notFound();
  return (
    <>
      <ContentHeader icon="book" title="História" topic={a.titulo} />
      <AdventurePlayer adventure={a} embedded treeHref={`/a/${a.id}/arvore`} />
    </>
  );
}
