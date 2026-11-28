import { AdventureSidebar } from "@/components/adventure/AdventureSidebar";
import { adventures } from "@/lib/adventures";

export default function AdventuresSidebarSlot() {
  return <AdventureSidebar adventures={adventures} />;
}
