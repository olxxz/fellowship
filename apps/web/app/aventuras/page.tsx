import type { Metadata } from "next";
import { AdventureShowcase } from "@/components/adventure/AdventureShowcase";
import { adventures } from "@/lib/adventures";

export const metadata: Metadata = { title: "Aventuras", description: "Aventuras curtas para jogar sozinho, só com texto e dados." };

export default function AdventuresPage() {
  return <AdventureShowcase adventures={adventures} backHref="/" />;
}
