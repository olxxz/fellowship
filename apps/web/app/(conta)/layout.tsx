import type { ReactNode } from "react";

// Tudo com login depende da sessão (cookies): nunca pré-renderizar no build.
export const dynamic = "force-dynamic";

export default function ContaLayout({ children }: { children: ReactNode }) {
  return children;
}
