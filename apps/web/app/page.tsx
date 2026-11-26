import { ButtonLink, Icon, ParticipantCard, RollCard, type IconName } from "@fellowship/ui";
import Link from "next/link";
import { APP_NAME } from "@/lib/brand";
import { campaignHref, spaceHref } from "@/lib/routes";
import { authEnabled } from "@/lib/supabase/config";
import styles from "./page.module.sass";

const FEATURES: Array<[IconName, string]> = [
  ["voice", "Voz com o retrato de cada personagem"],
  ["sheet", "Ficha modular do seu sistema"],
  ["dice", "Dados que todos veem, inclusive os ocultos do mestre"],
  ["book", "Memória da campanha, sessão a sessão"],
];

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark}>
            <Icon name="dice" size={20} />
          </span>
          {APP_NAME}
        </Link>
        {authEnabled ? (
          <Link className={styles.headerLink} href="/entrar">
            Entrar
          </Link>
        ) : (
          <Link className={styles.headerLink} href="/design-system">
            Design system
          </Link>
        )}
      </header>

      <main className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.overline}>RPG de mesa, online ou presencial</p>
          <h1 className={styles.title}>Sua mesa de RPG, inteira num lugar só.</h1>
          <p className={styles.lead}>
            Chamada de voz com a cara dos personagens, ficha, dados e a memória da campanha. Sem pular entre Discord, planilha e rolador.
          </p>
          <div className={styles.ctas}>
            {authEnabled ? (
              <>
                <ButtonLink className={styles.cta} href="/cadastro" linkAs={Link} variant="primary">
                  Criar conta grátis
                </ButtonLink>
                <ButtonLink className={styles.cta} href="/entrar" linkAs={Link}>
                  Já tenho conta
                </ButtonLink>
              </>
            ) : (
              <>
                <ButtonLink className={styles.cta} href={campaignHref("vel", "maldicao")} linkAs={Link} variant="primary" icon="dice">
                  Entrar na Mesa
                </ButtonLink>
                <ButtonLink className={styles.cta} href={spaceHref("vel", "geral")} linkAs={Link}>
                  Ver o Cenário
                </ButtonLink>
              </>
            )}
          </div>
          <p className={styles.demo}>
            {authEnabled ? (
              <>
                Só quer olhar? <Link href={campaignHref("vel", "maldicao")}>Veja a Mesa sem conta</Link>.
              </>
            ) : (
              "Demonstração com dados de exemplo, que ficam só no seu navegador."
            )}
          </p>
        </div>

        <div className={styles.stage} aria-hidden="true" inert>
          <ParticipantCard variant="portrait" characterName="Kael" playerName="Ana" color={1} speaking />
          <ParticipantCard variant="portrait" characterName="Brom" playerName="Bruno" color={2} />
          <ParticipantCard variant="portrait" characterName="Lia" playerName="Carla" color={3} muted />
          <ParticipantCard variant="portrait" characterName="Narrador" playerName="Rafa" />
          <div className={styles.roll}>
            <RollCard
              roller="Kael"
              label="Percepção"
              formula="2d20kh1 + 5"
              dice={[{ value: 20 }, { value: 9, discarded: true }]}
              modifier={5}
              total={25}
              color={1}
              critical={{ kind: "success", label: "20 natural" }}
            />
          </div>
        </div>
      </main>

      <footer className={styles.features}>
        {FEATURES.map(([icon, text]) => (
          <span key={text} className={styles.feature}>
            <Icon name={icon} size={16} />
            {text}
          </span>
        ))}
      </footer>
    </div>
  );
}
