import { Avatar, cx, playerColorStyle, type PlayerColor, type PresenceStatus } from "@fellowship/ui";
import styles from "./MembersList.module.sass";

const STATUS: Record<PresenceStatus, string> = { online: "online", ausente: "ausente", "em-sessao": "em sessão", offline: "offline" };

export interface MemberEntry {
  id: string;
  /** Nome em destaque: o personagem na campanha, o jogador no Cenário. */
  name: string;
  color: PlayerColor;
  /** Sem status (ainda não há presença em tempo real no app com login), o ponto não aparece. */
  status?: PresenceStatus;
  sub?: string;
  avatarUrl?: string;
  /** Na campanha, o personagem vem antes do jogador (retrato com anel, nome na cor dele). */
  asCharacter?: boolean;
}

export function MembersList({ groups, label }: { groups: Array<{ title: string; members: MemberEntry[] }>; label: string }) {
  return (
    <aside className={styles.members} aria-label={label}>
      {groups
        .filter((g) => g.members.length > 0)
        .map((group) => (
          <section key={group.title} className={styles.group}>
            <h2 className={styles.groupTitle}>
              {group.title} — {group.members.length}
            </h2>
            <ul className={styles.list}>
              {group.members.map((m) => (
                <li key={m.id} className={cx(styles.member, m.status === "offline" && styles.offline)} style={playerColorStyle(m.color)}>
                  <Avatar name={m.name} src={m.avatarUrl} color={m.color} size={32} status={m.status} appearance={m.asCharacter ? "ring" : "fill"} />
                  <span className={styles.text}>
                    <span className={cx(styles.name, m.asCharacter && styles.characterName)}>
                      {m.name}
                      {m.status && <span className={styles.hidden}>, {STATUS[m.status]}</span>}
                    </span>
                    {m.sub && <span className={styles.sub}>{m.sub}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </aside>
  );
}
