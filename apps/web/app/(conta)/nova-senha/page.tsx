import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { NewPasswordForm } from "@/components/auth/AuthForms";
import { requireAccount } from "@/lib/app/queries";

export const metadata: Metadata = { title: "Senha nova" };

export default async function NovaSenhaPage() {
  // O link do e-mail de recuperação já criou a sessão; sem ela, vai para /entrar.
  const { profile } = await requireAccount("/nova-senha");
  return (
    <AuthCard title="Senha nova" text={`Crie uma senha nova para a conta de ${profile.display_name}.`}>
      <NewPasswordForm />
    </AuthCard>
  );
}
