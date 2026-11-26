"use server";

import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/app/queries";
import { appSpaceHref } from "@/lib/routes";

export interface CreateSpaceState {
  error?: string;
  values?: { name: string; description: string; color: number; template: string };
}

/** Cria o Cenário pela função create_space do banco (tudo numa transação) e abre o primeiro canal de texto. */
export async function createSpaceAction(_prev: CreateSpaceState, form: FormData): Promise<CreateSpaceState> {
  const { supabase } = await requireAccount("/criar-cenario");
  const values = {
    name: String(form.get("name") ?? "").trim(),
    description: String(form.get("description") ?? "").trim(),
    color: Number(form.get("color") ?? 4),
    template: form.get("template") === "vazio" ? "vazio" : "padrao",
  };
  if (values.name.length < 2 || values.name.length > 60) return { error: "O nome do Cenário precisa ter entre 2 e 60 caracteres.", values };
  if (!Number.isInteger(values.color) || values.color < 1 || values.color > 6) values.color = 4;

  const { data: spaceId, error } = await supabase.rpc("create_space", {
    p_name: values.name,
    p_description: values.description || null,
    p_color: values.color,
    p_template: values.template,
  });
  if (error || typeof spaceId !== "string") {
    console.error("Falha ao criar Cenário", error);
    // As mensagens de validação do banco já vêm em português; o resto vira uma mensagem genérica.
    const known = error?.code === "22023" || error?.code === "28000";
    return { error: known ? error.message : "Não foi possível criar o Cenário agora. Tente de novo.", values };
  }

  const { data: first } = await supabase
    .from("channels")
    .select("id")
    .eq("space_id", spaceId)
    .eq("kind", "texto")
    .order("position")
    .limit(1)
    .maybeSingle<{ id: string }>();
  redirect(appSpaceHref(spaceId, first?.id));
}
