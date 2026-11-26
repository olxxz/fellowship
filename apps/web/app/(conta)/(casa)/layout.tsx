import type { ReactNode } from "react";
import { HomeFrame } from "@/components/account/HomeFrame";

// Área pessoal (Início, Amigos, Explorar, perfil, mensagens diretas): uma casca só, que não recarrega entre elas.
export default function CasaLayout({ children }: { children: ReactNode }) {
  return <HomeFrame>{children}</HomeFrame>;
}
