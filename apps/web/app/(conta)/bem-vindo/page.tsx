import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WelcomeForm } from "@/components/account/WelcomeForm";
import { AuthCard } from "@/components/auth/AuthCard";
import { requireAccount } from "@/lib/app/queries";
import { APP_NAME } from "@/lib/brand";
import { safeNext } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Boas-vindas" };

/** Primeira entrada: escolher o nick e conferir nome, foto e cor. */
export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: raw } = await searchParams;
  const next = safeNext(raw);
  const { profile } = await requireAccount("/bem-vindo", { welcome: true });
  if (profile.onboarded) redirect(next);
  return (
    <AuthCard title={`Boas-vindas ao ${APP_NAME}`} text="Escolha seu nick: é como os amigos acham você. O resto dá para mudar depois.">
      <WelcomeForm profile={profile} next={next} />
    </AuthCard>
  );
}
