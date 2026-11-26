import { beforeAll, describe, expect, it } from "vitest";
import { as, createTestDb, createUser, type Db } from "./harness";

const one = async <T>(db: Db, sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows[0]!;

describe("criar canais e categorias em Cenários existentes", () => {
  let db: Db;
  let ana: string;
  let bruno: string;
  let space: string;

  beforeAll(async () => {
    db = await createTestDb();
    ana = await createUser(db, "Ana");
    bruno = await createUser(db, "Bruno");
    space = await as(db, ana, async () => (await one<{ id: string }>(db, "select public.create_space('Terras de Vel', null, '#c08a3e') as id")).id);
    const code = await as(db, ana, async () => (await one<{ c: string }>(db, "select public.create_invite($1) as c", [space])).c);
    await as(db, bruno, () => db.query("select public.accept_invite($1)", [code]));
  });

  it("o dono cria categoria e canal de voz no fim da categoria, e os membros veem", async () => {
    const cat = await as(db, ana, async () => (await one<{ id: string }>(db, "select public.create_category($1, ' Sessões ') as id", [space])).id);
    const ch = await as(db, ana, async () => (await one<{ id: string }>(db, "select public.create_channel($1, $2, 'voz', 'Taverna', null) as id", [space, cat])).id);
    const ch2 = await as(db, ana, async () => (await one<{ id: string }>(db, "select public.create_channel($1, $2, 'texto', 'planos', 'Combinar a próxima') as id", [space, cat])).id);
    const rows = await as(db, bruno, async () => (await db.query<{ id: string; name: string; position: number; kind: string }>("select id, name, position, kind from public.channels where category_id = $1 order by position", [cat])).rows);
    expect(rows.map((r) => [r.id, r.name, r.kind, r.position])).toEqual([
      [ch, "Taverna", "voz", 0],
      [ch2, "planos", "texto", 1],
    ]);
    expect((await as(db, bruno, () => one<{ name: string }>(db, "select name from public.categories where id = $1", [cat]))).name).toBe("Sessões");
  });

  it("membro sem Gerenciar canais não cria; dados inválidos são recusados", async () => {
    await expect(as(db, bruno, () => db.query("select public.create_channel($1, null, 'texto', 'meu-canal')", [space]))).rejects.toThrow(/não pode gerenciar canais/);
    await expect(as(db, bruno, () => db.query("select public.create_category($1, 'X')", [space]))).rejects.toThrow(/não pode gerenciar canais/);
    await expect(as(db, ana, () => db.query("select public.create_channel($1, null, 'xadrez', 'a')", [space]))).rejects.toThrow(/Tipo de canal inválido/);
    await expect(as(db, ana, () => db.query("select public.create_channel($1, null, 'texto', '   ')", [space]))).rejects.toThrow(/1 a 40/);
    await expect(as(db, ana, () => db.query("select public.create_channel($1, gen_random_uuid(), 'texto', 'a')", [space]))).rejects.toThrow(/Categoria não encontrada/);
    await expect(as(db, null, () => db.query("select public.create_channel($1, null, 'texto', 'a')", [space]))).rejects.toThrow(/permission denied/);
  });
});
