import type { ReactNode } from "react";
import { HomeShell } from "@/components/shell/HomeShell";

export default function InicioLayout({ children }: { children: ReactNode }) {
  return <HomeShell>{children}</HomeShell>;
}
