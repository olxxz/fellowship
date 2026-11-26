"use client";

import { ChatMessage, IconButton, Skeleton, SkeletonRegion, SkeletonText } from "@fellowship/ui";
import headerStyles from "@/components/shell/ContentHeader.module.sass";
import { useShell } from "@/components/shell/ShellContext";
import styles from "./PageSkeleton.module.sass";

// Esqueletos de carregamento por região (loading.tsx). Aparecem só depois de ~200ms (CSS do Skeleton),
// então trocas rápidas não piscam; trocas lentas mostram na hora que algo está acontecendo.

function HeaderSkeleton() {
  const { openDrawer } = useShell();
  return (
    <header className={headerStyles.header}>
      <IconButton className={headerStyles.menu} variant="ghost" icon="menu" label="Abrir navegação" onClick={openDrawer} />
      <Skeleton width={20} height={20} />
      <Skeleton width={120} height={16} />
    </header>
  );
}

/** Canal carregando: cabeçalho, mensagens e caixa de mensagem nas mesmas posições. */
export function ChannelSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <SkeletonRegion
        className={styles.body}
        loading
        fallback={
          <>
            <div className={styles.messages}>
              {[0, 1, 2, 3].map((i) => (
                <ChatMessage.Skeleton key={i} seed={i} />
              ))}
            </div>
            <div className={styles.composer}>
              <Skeleton height={52} style={{ borderRadius: "var(--radius-lg)" }} />
            </div>
          </>
        }
      >
        {null}
      </SkeletonRegion>
    </>
  );
}

/** Tela de formulário carregando (configurações, perfil, criar Cenário). */
export function FormSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <SkeletonRegion
        className={styles.page}
        loading
        fallback={
          <>
            <Skeleton width="45%" height={28} />
            <Skeleton height={88} style={{ borderRadius: "var(--radius-xl)" }} />
            <SkeletonText lines={2} lineHeight={14} />
            <Skeleton height={44} style={{ borderRadius: "var(--radius-lg)" }} />
            <Skeleton height={44} style={{ borderRadius: "var(--radius-lg)" }} />
            <Skeleton width={160} height={44} style={{ borderRadius: "var(--radius-md)" }} />
          </>
        }
      >
        {null}
      </SkeletonRegion>
    </>
  );
}

/** Início carregando: saudação e cards de Cenário. */
export function HomeSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <SkeletonRegion
        className={styles.page}
        style={{ maxWidth: "none" }}
        loading
        fallback={
          <>
            <Skeleton width={220} height={30} />
            <div className={styles.grid}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={112} style={{ borderRadius: "var(--radius-xl)" }} />
              ))}
            </div>
          </>
        }
      >
        {null}
      </SkeletonRegion>
    </>
  );
}
