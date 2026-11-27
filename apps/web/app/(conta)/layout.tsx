import type { ReactNode } from "react";
import { VoiceProvider } from "@/lib/livekit/VoiceProvider";
import { PresenceProvider } from "@/lib/presence/PresenceProvider";

// Tudo com login depende da sessão (cookies): nunca pré-renderizar no build.
export const dynamic = "force-dynamic";

export default function ContaLayout({ children }: { children: ReactNode }) {
  // A voz fica acima de todas as páginas logadas: trocar de canal ou de Cenário não desconecta.
  return (
    <VoiceProvider>
      <PresenceProvider>{children}</PresenceProvider>
    </VoiceProvider>
  );
}
