import type { ReactNode } from "react";
import { HomeFrame } from "@/components/account/HomeFrame";

export default function Layout({ children }: { children: ReactNode }) {
  return <HomeFrame>{children}</HomeFrame>;
}
