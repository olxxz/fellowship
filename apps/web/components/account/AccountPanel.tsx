"use client";

import { Avatar, IconButton, Menu } from "@fellowship/ui";
import Link from "next/link";
import { useRef } from "react";
import styles from "@/components/shell/UserPanel.module.sass";
import { ThemeMenuGroup } from "@/components/shell/ThemeMenuGroup";
import { useOptionalVoice } from "@/lib/livekit/VoiceProvider";
import { campaignHref, editProfileHref, friendsHref, myProfileHref } from "@/lib/routes";

export interface AccountProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  color: string;
  username: string;
}

/** Painel da conta no rodapé da barra lateral: quem está logado, tema e sair. */
export function AccountPanel({ profile }: { profile: AccountProfile }) {
  const logout = useRef<HTMLFormElement>(null);
  const voice = useOptionalVoice();
  const inVoice = voice?.current;
  return (
    <div className={styles.dock}>
      {inVoice && (
        <div className={styles.voiceBar}>
          <div className={styles.who}>
            <span className={styles.voiceState}>
              {voice.status === "on" ? "Voz conectada" : "Conectando…"}
            </span>
            <Link
              className={styles.status}
              href={`/c/${inVoice.spaceId}/${inVoice.id}`}
            >
              {inVoice.name}
            </Link>
          </div>
          <IconButton
            icon="leave"
            label="Sair da voz"
            variant="danger"
            onClick={voice.leave}
          />
        </div>
      )}
      <div className={styles.panel}>
        {/* Avatar e nome abrem o próprio perfil, como os outros veem. */}
        <Link href={myProfileHref} className={styles.me} aria-label={`Seu perfil, ${profile.display_name}`}>
          <Avatar name={profile.display_name} src={profile.avatar_url ?? undefined} color={profile.color} size={36} />
          <span className={styles.who}>
            <span className={styles.name}>{profile.display_name}</span>
            <span className={styles.status}>@{profile.username}</span>
          </span>
        </Link>
        {voice?.enabled && (
          <IconButton
            icon={voice.muted ? "micOff" : "mic"}
            label={voice.muted ? "Ativar microfone" : "Mutar microfone"}
            aria-pressed={voice.muted}
            variant={voice.muted ? "danger" : "secondary"}
            onClick={() => voice.setMuted(!voice.muted)}
          />
        )}
        <Menu.Root>
          <Menu.Trigger
            render={<IconButton icon="settings" label="Configurações" />}
          />
          <Menu.Popup side="top" align="end">
            <Menu.Header>
              <span className={styles.menuWho}>
                <Avatar name={profile.display_name} src={profile.avatar_url ?? undefined} color={profile.color} size={36} />
                <span className={styles.who}>
                  <span className={styles.name}>{profile.display_name}</span>
                  <span className={styles.status}>@{profile.username}</span>
                </span>
              </span>
            </Menu.Header>
            <Menu.LinkItem icon="users" render={<Link href={myProfileHref} />}>
              Ver perfil
            </Menu.LinkItem>
            <Menu.LinkItem icon="pencil" render={<Link href={editProfileHref} />}>
              Editar perfil
            </Menu.LinkItem>
            <Menu.LinkItem icon="userPlus" render={<Link href={friendsHref} />}>
              Amigos
            </Menu.LinkItem>
            {voice?.enabled && (
              <Menu.Item icon="mic" onClick={() => voice.setSettingsOpen(true)}>
                Voz e vídeo
              </Menu.Item>
            )}
            <Menu.Separator />
            <ThemeMenuGroup />
            <Menu.Separator />
            <Menu.Group label="Explorar">
              <Menu.LinkItem icon="dice" render={<Link href={campaignHref("vel", "maldicao")} />}>
                Protótipo da Mesa
              </Menu.LinkItem>
              <Menu.LinkItem icon="grid" render={<Link href="/design-system" />}>
                Design system
              </Menu.LinkItem>
            </Menu.Group>
            <Menu.Separator />
            <Menu.Item icon="doorOpen" tone="danger" onClick={() => logout.current?.requestSubmit()}>
              Sair da conta
            </Menu.Item>
          </Menu.Popup>
        </Menu.Root>
        <form ref={logout} action="/auth/sair" method="post" hidden />
      </div>
    </div>
  );
}
