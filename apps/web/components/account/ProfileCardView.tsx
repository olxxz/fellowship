import { Avatar, playerColorStyle } from "@fellowship/ui";
import type { ReactNode } from "react";
import styles from "./ProfileCardView.module.sass";

export interface ProfileCardData {
  display_name: string;
  username: string;
  avatar_url: string | null;
  color: string;
  bio: string | null;
}

/**
 * Cartão de perfil como os outros veem: banner na cor da pessoa, avatar, nome, @nick e bio.
 * `compact` é o do cartão ao passar o mouse na lista de membros.
 */
export function ProfileCardView({ profile, compact, children }: { profile: ProfileCardData; compact?: boolean; children?: ReactNode }) {
  return (
    <article className={`${styles.card} ${compact ? styles.compact : ""}`} style={playerColorStyle(profile.color)}>
      <div className={styles.banner} aria-hidden="true" />
      <div className={styles.body}>
        <span className={styles.avatar}>
          <Avatar name={profile.display_name} src={profile.avatar_url ?? undefined} color={profile.color} size={compact ? 64 : 96} />
        </span>
        <h2 className={styles.name}>{profile.display_name}</h2>
        <p className={styles.username}>@{profile.username}</p>
        {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
        {children && <div className={styles.actions}>{children}</div>}
      </div>
    </article>
  );
}
