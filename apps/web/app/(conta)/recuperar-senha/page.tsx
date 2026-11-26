import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import styles from "@/components/auth/Auth.module.sass";
import { ResetRequestForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecuperarSenhaPage() {
  return (
    <AuthCard
      title="Recuperar senha"
      text="Enviamos um link para você criar uma senha nova. Se entrou com o Google, não precisa de senha."
      footer={
        <Link className={styles.link} href="/entrar">
          Voltar para entrar
        </Link>
      }
    >
      <ResetRequestForm />
    </AuthCard>
  );
}
