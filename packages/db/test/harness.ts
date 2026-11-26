// Banco de teste: Postgres de verdade (PGlite) com um esboço do que o Supabase fornece
// (papéis anon/authenticated, auth.users, auth.uid() e a publicação do Realtime), mais as migrações do repositório.
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS = join(__dirname, "../../../supabase/migrations");

const SUPABASE_STUB = `
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
-- Como no Supabase: privilégios amplos por padrão, que a migração precisa restringir.
grant all on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
create publication supabase_realtime;
`;

export async function createTestDb() {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
  }
  return db;
}

export type Db = Awaited<ReturnType<typeof createTestDb>>;

/** Cria uma conta como o Auth do Supabase faria (o gatilho cria o perfil). */
export async function createUser(db: Db, name: string, extra: Record<string, unknown> = {}) {
  const { rows } = await db.query<{ id: string }>(
    "insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id",
    [`${name.toLowerCase()}@exemplo.com`, JSON.stringify({ full_name: name, ...extra })],
  );
  return rows[0]!.id;
}

/** Roda consultas como um usuário logado (papel authenticated + auth.uid()), ou como anônimo. */
export async function as<T>(db: Db, userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${userId ? "authenticated" : "anon"}`);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ""]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}
