import { redirect } from "next/navigation";
import { Landing } from "@/components/landing/Landing";
import { authEnabled } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";

// "/" é o app: com conta logada vai direto para o Início; sem, para a apresentação em /sobre.
// No GitHub Pages (sem login) a apresentação fica aqui mesmo.
export default async function Root() {
  if (!authEnabled) return <Landing />;
  const { user } = await getUser();
  redirect(user ? "/inicio" : "/sobre");
}
