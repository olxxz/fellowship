import { notFound } from "next/navigation";
import { AdventureTree } from "@/components/adventure/AdventureTree";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { adventureById } from "@/lib/adventures";

export default async function AdventureTreePage({ params }: { params: Promise<{ adventure: string }> }) {
  const a = adventureById((await params).adventure);
  if (!a) notFound();
  return (
    <>
      <ContentHeader icon="map" title="Árvore de escolhas" topic={a.titulo} />
      <AdventureTree adventure={a} />
    </>
  );
}
