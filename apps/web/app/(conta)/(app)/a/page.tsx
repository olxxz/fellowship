import type { Metadata } from "next";
import { AdventureShowcase } from "@/components/adventure/AdventureShowcase";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { adventures } from "@/lib/adventures";

export const metadata: Metadata = { title: "Aventuras" };

export default function AppAdventuresPage() {
  return (
    <>
      <ContentHeader icon="book" title="Aventuras" topic="Histórias prontas para jogar sozinho" />
      <AdventureShowcase adventures={adventures} hrefBase="/a" embedded />
    </>
  );
}
