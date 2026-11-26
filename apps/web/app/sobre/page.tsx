import { Landing } from "@/components/landing/Landing";
import { authEnabled } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";

/** Apresentação do app. Com login, confere a conta para mostrar o avatar no topo. */
export default async function SobrePage() {
  if (!authEnabled) return <Landing />;
  const { supabase, user } = await getUser();
  if (!user) return <Landing />;
  const { data: account } = await supabase.from("profiles").select("display_name, avatar_url, color").eq("id", user.id).maybeSingle<{ display_name: string; avatar_url: string | null; color: string }>();
  return <Landing account={account} />;
}
