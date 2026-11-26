"use client";

import { Button } from "@fellowship/ui";
import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, signInWithPassword, signUpWithPassword, updatePassword, type AuthFormState } from "@/lib/app/auth-actions";
import styles from "./Auth.module.sass";

function Feedback({ state }: { state: AuthFormState }) {
  if (state.error)
    return (
      <p className={styles.error} role="alert">
        {state.error}
      </p>
    );
  if (state.notice)
    return (
      <p className={styles.notice} role="status">
        {state.notice}
      </p>
    );
  return null;
}

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInWithPassword, {});
  return (
    <form className={styles.form} action={action}>
      <input type="hidden" name="next" value={next} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          E-mail
        </label>
        <input className={styles.input} id="email" name="email" type="email" autoComplete="email" required defaultValue={state.email} />
      </div>
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="password">
            Senha
          </label>
          <Link className={`${styles.link} ${styles.small}`} href="/recuperar-senha">
            Esqueci minha senha
          </Link>
        </div>
        <input className={styles.input} id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <Feedback state={state} />
      <Button className={styles.submit} type="submit" variant="primary" loading={pending}>
        Entrar
      </Button>
    </form>
  );
}

export function SignUpForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signUpWithPassword, {});
  if (state.notice) return <Feedback state={state} />;
  return (
    <form className={styles.form} action={action}>
      <input type="hidden" name="next" value={next} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">
          Como quer ser chamado
        </label>
        <input className={styles.input} id="name" name="name" autoComplete="nickname" required maxLength={60} defaultValue={state.name} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          E-mail
        </label>
        <input className={styles.input} id="email" name="email" type="email" autoComplete="email" required defaultValue={state.email} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          Senha
        </label>
        <input className={styles.input} id="password" name="password" type="password" autoComplete="new-password" required minLength={8} aria-describedby="password-hint" />
        <span className={styles.hint} id="password-hint">
          Pelo menos 8 caracteres.
        </span>
      </div>
      <Feedback state={state} />
      <Button className={styles.submit} type="submit" variant="primary" loading={pending}>
        Criar conta
      </Button>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});
  return (
    <form className={styles.form} action={action}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          E-mail da conta
        </label>
        <input className={styles.input} id="email" name="email" type="email" autoComplete="email" required defaultValue={state.email} />
      </div>
      <Feedback state={state} />
      <Button className={styles.submit} type="submit" variant="primary" loading={pending}>
        Enviar link
      </Button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {});
  return (
    <form className={styles.form} action={action}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          Senha nova
        </label>
        <input className={styles.input} id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="confirm">
          Repita a senha
        </label>
        <input className={styles.input} id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      <Feedback state={state} />
      <Button className={styles.submit} type="submit" variant="primary" loading={pending}>
        Salvar senha
      </Button>
    </form>
  );
}
