import { Avatar, ButtonLink, Icon, type IconName } from "@fellowship/ui";
import Image from "next/image";
import Link from "next/link";
import dragao from "./art/dragao.webp";
import elfa from "./art/elfa.webp";
import mago from "./art/mago.webp";
import orc from "./art/orc.webp";
import { APP_NAME } from "@/lib/brand";
import { campaignHref, spaceHref } from "@/lib/routes";
import { authEnabled } from "@/lib/supabase/config";
import styles from "./Landing.module.sass";

const FEATURES: Array<[IconName, string]> = [
  ["mic", "Voz com o rosto do personagem"],
  ["sheet", "Ficha do seu sistema"],
  ["dice", "Dados à vista de todos"],
  ["eye", "Rolagens ocultas do mestre"],
  ["book", "Memória da campanha"],
  ["userPlus", "Convite por link"],
];

const PORTRAITS = [
  { src: elfa, alt: "Elfa" },
  { src: mago, alt: "Mago" },
  { src: orc, alt: "Orc" },
  { src: dragao, alt: "Dragão" },
];

export interface LandingAccount {
  display_name: string;
  avatar_url: string | null;
  color: string;
}

/** Página de apresentação (em /sobre). Com a conta logada, mostra o avatar e troca os botões por "Explorar". */
export function Landing({ account }: { account?: LandingAccount | null }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark}>
            <Icon name="dice" size={20} />
          </span>
          {APP_NAME}
        </Link>
        {account ? (
          <Link className={styles.account} href="/inicio" aria-label={`Abrir o app como ${account.display_name}`}>
            <span className={styles.accountName}>{account.display_name}</span>
            <Avatar name={account.display_name} src={account.avatar_url ?? undefined} color={account.color} size={36} />
          </Link>
        ) : (
          <Link className={styles.headerLink} href={authEnabled ? "/entrar" : "/design-system"}>
            {authEnabled ? "Entrar" : "Design system"}
          </Link>
        )}
      </header>

      <main className={styles.hero}>
        <div className={styles.copy}>
          <h1 className={styles.title}>Sua mesa de RPG, inteira num lugar só.</h1>
          <p className={styles.lead}>Voz, fichas e dados para jogar com o seu grupo.</p>
          <div className={styles.ctas}>
            {account ? (
              <>
                <ButtonLink className={styles.cta} href="/inicio" linkAs={Link} variant="primary" icon="home">
                  Explorar
                </ButtonLink>
                <ButtonLink className={styles.cta} href={campaignHref("vel", "maldicao")} linkAs={Link}>
                  Ver a Mesa de exemplo
                </ButtonLink>
              </>
            ) : authEnabled ? (
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
          {authEnabled && !account && (
            <Link className={styles.demo} href={campaignHref("vel", "maldicao")}>
              Ver a Mesa sem conta
            </Link>
          )}
        </div>

        <div className={styles.scene} aria-hidden="true">
          {/* Uma chamada de vídeo do app, em miniatura: cabeçalho do canal, quatro câmeras e os controles. */}
          <div className={styles.glow} />
          <div className={styles.call}>
            <div className={styles.callBar}>
              <Icon name="mic" size={16} />
              Taverna
            </div>
            <div className={styles.callGrid}>
              {PORTRAITS.map((p) => (
                <Image key={p.alt} className={styles.tile} src={p.src} alt="" sizes="(max-width: 1200px) 24vw, 300px" priority />
              ))}
            </div>
            <div className={styles.callControls}>
              <span className={styles.ctl}>
                <Icon name="mic" size={18} />
              </span>
              <span className={styles.ctl}>
                <Icon name="camera" size={18} />
              </span>
              <span className={styles.ctl}>
                <Icon name="screen" size={18} />
              </span>
              <span className={`${styles.ctl} ${styles.ctlLeave}`}>
                <Icon name="leave" size={18} />
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.features}>
        <span className={styles.srOnly}>{FEATURES.map(([, text]) => text).join(". ")}.</span>
        <div className={styles.marquee} aria-hidden="true">
          {[0, 1].map((copy) => (
            <ul key={copy} className={styles.track}>
              {FEATURES.map(([icon, text]) => (
                <li key={text} className={styles.feature}>
                  <Icon name={icon} size={16} />
                  {text}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </footer>
    </div>
  );
}
