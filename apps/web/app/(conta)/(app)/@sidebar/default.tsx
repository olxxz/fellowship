import { AccountHomeSidebar } from "@/components/account/AccountHomeSidebar";
import { getDirectUnread, getFriendsView, requireAccount } from "@/lib/app/queries";

/** Barra lateral do Início (área pessoal, amigos, conversas diretas): vale para tudo fora de um Cenário. */
export default async function SidebarDefault() {
  const { supabase, profile } = await requireAccount();
  const [friends, directUnread] = await Promise.all([getFriendsView(supabase, profile.id), getDirectUnread(supabase)]);
  return <AccountHomeSidebar friends={friends.friends} incoming={friends.incoming.length} initialUnread={directUnread} />;
}
