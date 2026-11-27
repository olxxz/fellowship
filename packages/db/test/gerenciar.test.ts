import { beforeAll, describe, expect, it } from "vitest";
import { as, createTestDb, createUser, type Db } from "./harness";

const one = async <T>(db: Db, sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows[0]!;
const all = async <T>(db: Db, sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows;

describe("gerenciar o Cenário", () => {
  let db: Db;
  let ana: string; // dona
  let bruno: string; // moderador
  let carla: string; // membro
  let space: string;
  let mod: string;

  beforeAll(async () => {
    db = await createTestDb();
    ana = await createUser(db, "Ana");
    bruno = await createUser(db, "Bruno");
    carla = await createUser(db, "Carla");
    space = await as(db, ana, async () => (await one<{ id: string }>(db, "select public.create_space('Vel') as id")).id);
    const code = await as(db, ana, async () => (await one<{ c: string }>(db, "select public.create_invite($1) as c", [space])).c);
    await as(db, bruno, () => db.query("select public.accept_invite($1)", [code]));
    await as(db, carla, () => db.query("select public.accept_invite($1)", [code]));
    // Moderador: gerencia cargos e canais e expulsa.
    mod = await as(db, ana, async () => (await one<{ id: string }>(db, "select public.create_role($1, 'Moderador', 2::smallint, $2) as id", [space, 1 | 2 | 4 | 256 | 512 | 2048])).id);
    await as(db, ana, () => db.query("select public.set_member_roles($1, $2, $3)", [space, bruno, `{${mod}}`]));
    // Sobe o Moderador para o topo (cargo novo entra embaixo).
    const order = await all<{ id: string }>(db, "select id from public.roles where space_id = $1 and not is_default and id <> $2 order by position desc", [space, mod]);
    await as(db, ana, () => db.query("select public.reorder_roles($1, $2)", [space, `{${[mod, ...order.map((r) => r.id)].join(",")}}`]));
  });

  it("dono tem todas as permissões (4095), inclusive expulsar", async () => {
    expect((await as(db, ana, () => one<{ p: number }>(db, "select public.space_permissions($1) as p", [space]))).p).toBe(4095);
  });

  it("moderador não cria cargo com permissão que não tem, nem mexe em cargo acima do dele", async () => {
    await expect(as(db, bruno, () => db.query("select public.create_role($1, 'Rei', null, 1024)", [space]))).rejects.toThrow(/permissões que não tem/);
    const helper = await as(db, bruno, async () => (await one<{ id: string }>(db, "select public.create_role($1, 'Ajudante', null, 3) as id", [space])).id);
    await expect(as(db, bruno, () => db.query("select public.update_role($1, 'Mod', null, 1, false)", [mod]))).rejects.toThrow(/abaixo do seu cargo/);
    await as(db, bruno, () => db.query("select public.update_role($1, 'Ajudante', 3::smallint, 3, true)", [helper]));
    expect((await one<{ granted_on_join: boolean }>(db, "select granted_on_join from public.roles where id = $1", [helper])).granted_on_join).toBe(true);
  });

  it("canal privado: nega ver para todos e libera para um cargo", async () => {
    const channel = (await one<{ id: string }>(db, "select id from public.channels where space_id = $1 and kind = 'texto' order by position limit 1", [space])).id;
    const everyone = (await one<{ id: string }>(db, "select id from public.roles where space_id = $1 and is_default", [space])).id;
    await as(db, bruno, () => db.query("select public.set_channel_override($1, $2, 0, 1)", [channel, everyone]));
    await as(db, bruno, () => db.query("select public.set_channel_override($1, $2, 1, 0)", [channel, mod]));
    expect(await as(db, carla, () => all(db, "select id from public.channels where id = $1", [channel]))).toHaveLength(0);
    expect(await as(db, bruno, () => all(db, "select id from public.channels where id = $1", [channel]))).toHaveLength(1);
    expect(await as(db, bruno, () => all(db, "select * from public.channel_overrides($1)", [channel]))).toHaveLength(2);
    await as(db, bruno, () => db.query("select public.set_channel_override($1, $2, 0, 0)", [channel, everyone]));
    expect(await as(db, carla, () => all(db, "select id from public.channels where id = $1", [channel]))).toHaveLength(1);
  });

  it("editar, reordenar e apagar canais e categorias", async () => {
    const cats = await all<{ id: string }>(db, "select id from public.categories where space_id = $1 order by position", [space]);
    await as(db, bruno, () => db.query("select public.reorder_categories($1, $2)", [space, `{${[...cats].reverse().map((c) => c.id).join(",")}}`]));
    const first = (await one<{ id: string }>(db, "select id from public.categories where space_id = $1 order by position limit 1", [space])).id;
    expect(first).toBe(cats[cats.length - 1]!.id);
    const ch = (await one<{ id: string }>(db, "select id from public.channels where space_id = $1 order by position limit 1", [space])).id;
    await as(db, bruno, () => db.query("select public.update_channel($1, 'mural', 'Tudo aqui', null)", [ch]));
    expect((await one<{ name: string; category_id: string | null }>(db, "select name, category_id from public.channels where id = $1", [ch]))).toEqual({ name: "mural", category_id: null });
    await expect(as(db, carla, () => db.query("select public.delete_channel($1)", [ch]))).rejects.toThrow(/gerenciar canais/);
    await as(db, bruno, () => db.query("select public.delete_category($1)", [first]));
    await as(db, bruno, () => db.query("select public.delete_channel($1)", [ch]));
    expect(await all(db, "select 1 from public.channels where id = $1", [ch])).toHaveLength(0);
  });

  it("expulsar quem está abaixo; dono não sai e não é expulso; membro sai", async () => {
    await expect(as(db, bruno, () => db.query("select public.kick_member($1, $2)", [space, ana]))).rejects.toThrow(/dono não pode/);
    await expect(as(db, carla, () => db.query("select public.kick_member($1, $2)", [space, bruno]))).rejects.toThrow(/expulsar membros/);
    await expect(as(db, ana, () => db.query("select public.leave_space($1)", [space]))).rejects.toThrow(/não sai/);
    await as(db, bruno, () => db.query("select public.kick_member($1, $2)", [space, carla]));
    expect(await as(db, carla, () => all(db, "select 1 from public.spaces where id = $1", [space]))).toHaveLength(0);
    await as(db, bruno, () => db.query("select public.leave_space($1)", [space]));
    expect(await as(db, bruno, () => all(db, "select 1 from public.spaces where id = $1", [space]))).toHaveLength(0);
  });
});
