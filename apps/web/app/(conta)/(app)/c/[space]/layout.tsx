import type { ReactNode } from "react";
import { getSpaceView, requireAccount } from "@/lib/app/queries";

// A casca e a barra do Cenário ficam acima (layout do app e slot da barra). Aqui só confere o acesso.
export default async function SpaceLayout({ children, params }: { children: ReactNode; params: Promise<{ space: string }> }) {
  const { space: spaceId } = await params;
  const { supabase } = await requireAccount(`/c/${spaceId}`);
  await getSpaceView(supabase, spaceId);
  return children;
}
