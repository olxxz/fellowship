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

/** Lista de pessoas carregando (Amigos, membros). */
export function ListSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <SkeletonRegion
        className={styles.page}
        loading
        fallback={
          <>
            <Skeleton width="35%" height={28} />
            <Skeleton height={44} style={{ borderRadius: "var(--radius-lg)" }} />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.row}>
                <Skeleton width={40} height={40} circle />
                <span className={styles.rowText}>
                  <Skeleton width={`${30 + ((i * 13) % 30)}%`} height={14} />
                  <Skeleton width="20%" height={12} />
                </span>
              </div>
            ))}
          </>
        }
      >
        {null}
      </SkeletonRegion>
    </>
  );
}

/** Perfil carregando: o cartão com banner, avatar e nome. */
export function ProfileSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <SkeletonRegion
        className={styles.page}
        loading
        fallback={
          <div className={styles.profileCard}>
            <Skeleton height={120} style={{ borderRadius: 0 }} />
            <div className={styles.profileBody}>
              <Skeleton width={96} height={96} circle style={{ marginTop: -48 }} />
              <Skeleton width="45%" height={22} />
              <Skeleton width="25%" height={14} />
              <Skeleton width={160} height={44} style={{ borderRadius: "var(--radius-md)" }} />
            </div>
          </div>
        }
      >
        {null}
      </SkeletonRegion>
    </>
  );
}

/** Explorar carregando: busca e cartões de Cenário. */
export function ExploreSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <SkeletonRegion
        className={styles.page}
        style={{ maxWidth: 960 }}
        loading
        fallback={
          <>
            <Skeleton width="40%" height={28} />
            <Skeleton height={44} style={{ borderRadius: "var(--radius-lg)" }} />
            <div className={styles.grid}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={styles.exploreCard}>
                  <Skeleton height={84} style={{ borderRadius: 0 }} />
                  <div className={styles.profileBody}>
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="80%" height={12} />
                    <Skeleton width={90} height={40} style={{ borderRadius: "var(--radius-md)" }} />
                  </div>
                </div>
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

/** Configurações carregando: abas e o formulário da primeira. */
export function SettingsSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <SkeletonRegion
        className={styles.page}
        style={{ maxWidth: 960 }}
        loading
        fallback={
          <>
            <Skeleton width="30%" height={28} />
            <div className={styles.tabs}>
              {[90, 70, 70, 80, 90].map((w, i) => (
                <Skeleton key={i} width={w} height={20} />
              ))}
            </div>
            <Skeleton height={88} style={{ borderRadius: "var(--radius-xl)", maxWidth: 720 }} />
            <Skeleton height={44} style={{ borderRadius: "var(--radius-lg)", maxWidth: 720 }} />
            <Skeleton height={44} style={{ borderRadius: "var(--radius-lg)", maxWidth: 720 }} />
          </>
        }
      >
        {null}
      </SkeletonRegion>
    </>
  );
}

/** Galeria carregando: o mural em colunas. */
export function GallerySkeleton() {
  return (
    <SkeletonRegion
      className={styles.galleryPage}
      loading
      fallback={
        <div className={styles.masonry}>
          {[240, 180, 300, 200, 260, 160, 220, 280].map((h, i) => (
            <Skeleton key={i} height={h} style={{ borderRadius: "var(--radius-lg)", marginBottom: 12 }} />
          ))}
        </div>
      }
    >
      {null}
    </SkeletonRegion>
  );
}

/** Sala de voz conectando: quadros no lugar das pessoas. */
export function VoiceSkeleton({ count = 2 }: { count?: number }) {
  return (
    <SkeletonRegion
      className={styles.voiceGrid}
      loading
      fallback={Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} style={{ aspectRatio: "16 / 10", borderRadius: "var(--radius-xl)" }} />
      ))}
    >
      {null}
    </SkeletonRegion>
  );
}
