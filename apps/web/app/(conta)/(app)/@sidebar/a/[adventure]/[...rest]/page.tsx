import { AdventureSidebar } from "@/components/adventure/AdventureSidebar";
import { adventureById, adventures } from "@/lib/adventures";

export default async function AdventureSidebarSlot({ params }: { params: Promise<{ adventure: string }> }) {
  return <AdventureSidebar adventures={adventures} current={adventureById((await params).adventure)} />;
}
