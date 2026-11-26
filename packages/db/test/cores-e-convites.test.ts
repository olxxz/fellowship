import { beforeAll, describe, expect, it } from "vitest";
import { applyMigrations, as, createTestDb, createUser, migrationFiles, type Db } from "./harness";

const one = async <T>(db: Db, sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows[0]!;

describe("conversão das cores numéricas (dados que já existem em produção)", () => {
  it("cores 1–6 de Cenários e perfis viram hex, e os cargos Membro passam a ser de entrada", async () => {
    const db = await createTestDb({ upTo: 1 });
    const ana = await createUser(db, "Ana");
    const space = await as(db, ana, async () => (await one<{ id: string }>(db, "select public.create_space('Terras de Vel', null, 2::smallint) as id")).id);
    await db.query("update public.profiles set color = 5 where id = $1", [ana]);

    await applyMigrations(db, migrationFiles().slice(1));

    expect((await one<{ color: string }>(db, "select color from public.spaces where id = $1", [space])).color).toBe("#e07a5f");
    expect((await one<{ color: string }>(db, "select color from public.profiles where id = $1", [ana])).color).toBe("#5b8def");
    expect((await one<{ g: boolean }>(db, "select granted_on_join as g from public.roles where space_id = $1 and name = 'Membro'", [space])).g).toBe(true);
  });
});

describe("cores livres e convites", () => {
  let db: Db;
  let ana: string;
  let bruno: string;
  let carla: string;
  let space: string;

  beforeAll(async () => {
    db = await createTestDb();
    ana = await createUser(db, "Ana");
    bruno = await createUser(db, "Bruno");
    carla = await createUser(db, "Carla");
    space = await as(db, ana, async () => (await one<{ id: string }>(db, "select public.create_space('Terras de Vel', null, '#FF6B9D') as id")).id);
  });

  it("aceita qualquer cor em hex (guardada em minúsculas) e recusa o resto", async () => {
    expect((await one<{ color: string }>(db, "select color from public.spaces where id = $1", [space])).color).toBe("#ff6b9d");
    await expect(as(db, ana, () => db.query("select public.create_space('Outro', null, 'vermelho')"))).rejects.toThrow(/#rrggbb/);
    await expect(as(db, ana, () => db.query("update public.profiles set color = 'azul' where id = $1", [ana]))).rejects.toThrow(/profiles_color_hex/);
    await as(db, ana, () => db.query("update public.profiles set color = '#123abc' where id = $1", [ana]));
  });

  it("perfil novo nasce com uma cor em hex", async () => {
    expect((await one<{ color: string }>(db, "select color from public.profiles where id = $1", [bruno])).color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("quem não é membro não cria convite; a prévia funciona até sem login", async () => {
    await expect(as(db, bruno, () => db.query("select public.create_invite($1)", [space]))).rejects.toThrow(/não pode criar convites/);
    const code = await as(db, ana, async () => (await one<{ c: string }>(db, "select public.create_invite($1, 24, 2) as c", [space])).c);
    expect(code).toMatch(/^[a-z0-9]{10}$/);

    const preview = await as(db, null, async () => one<{ name: string; member_count: number; inviter: string; status: string; already_member: boolean }>(db, "select * from public.get_invite($1)", [code.toUpperCase()]));
    expect(preview).toMatchObject({ name: "Terras de Vel", member_count: 1, inviter: "Ana", status: "valido", already_member: false });
    // A prévia não abre o resto do Cenário.
    await expect(as(db, null, () => db.query("select * from public.spaces"))).rejects.toThrow(/permission denied/);
    await expect(as(db, null, () => db.query("select public.accept_invite($1)", [code]))).rejects.toThrow(/permission denied/);
  });

  it("aceitar entra como Membro (pode escrever), conta o uso e esgota no limite", async () => {
    const code = await as(db, ana, async () => (await one<{ c: string }>(db, "select public.create_invite($1, null, 1) as c", [space])).c);
    const joined = await as(db, bruno, async () => (await one<{ id: string }>(db, "select public.accept_invite($1) as id", [code])).id);
    expect(joined).toBe(space);
    await as(db, bruno, async () => {
      const geral = (await one<{ id: string }>(db, "select id from public.channels where name = 'Geral'")).id;
      await db.query("insert into public.messages (space_id, channel_id, author_id, content) values ($1, $2, $3, 'Cheguei pelo convite!')", [space, geral, bruno]);
      // Aceitar de novo não gasta uso nem dá erro.
      expect((await one<{ id: string }>(db, "select public.accept_invite($1) as id", [code])).id).toBe(space);
    });
    expect((await one<{ uses: number }>(db, "select uses from public.invites where code = $1", [code])).uses).toBe(1);
    await expect(as(db, carla, () => db.query("select public.accept_invite($1)", [code]))).rejects.toThrow(/esgotado/);
  });

  it("convite revogado ou expirado não funciona", async () => {
    const code = await as(db, ana, async () => (await one<{ c: string }>(db, "select public.create_invite($1) as c", [space])).c);
    await expect(as(db, bruno, () => db.query("select public.revoke_invite($1)", [code]))).rejects.toThrow(/não encontrado/);
    await as(db, ana, () => db.query("select public.revoke_invite($1)", [code]));
    await expect(as(db, carla, () => db.query("select public.accept_invite($1)", [code]))).rejects.toThrow(/revogado/);

    const old = await as(db, ana, async () => (await one<{ c: string }>(db, "select public.create_invite($1, 1) as c", [space])).c);
    await db.query("update public.invites set expires_at = now() - interval '1 minute' where code = $1", [old]);
    await expect(as(db, carla, () => db.query("select public.accept_invite($1)", [old]))).rejects.toThrow(/expirado/);
    expect((await as(db, carla, () => db.query("select * from public.get_invite('naoexiste1')"))).rows).toEqual([]);
  });

  it("valida validade e limite de usos", async () => {
    await expect(as(db, ana, () => db.query("select public.create_invite($1, 0)", [space]))).rejects.toThrow(/1 hora a 30 dias/);
    await expect(as(db, ana, () => db.query("select public.create_invite($1, 24, 0)", [space]))).rejects.toThrow(/1 a 1000/);
  });

  it("cada um vê os próprios convites; quem gerencia vê todos", async () => {
    await as(db, bruno, () => db.query("select public.create_invite($1)", [space]));
    const brunoSees = await as(db, bruno, async () => (await db.query<{ created_by: string }>("select created_by from public.invites")).rows);
    expect(brunoSees.every((r) => r.created_by === bruno)).toBe(true);
    const anaSees = await as(db, ana, async () => (await db.query<{ created_by: string }>("select distinct created_by from public.invites")).rows);
    expect(anaSees.map((r) => r.created_by).sort()).toEqual([ana, bruno].sort());
  });

  it("dono edita o Cenário; membro sem gerenciar tema não", async () => {
    await as(db, ana, () => db.query("update public.spaces set name = 'Terras de Vel Antiga', color = '#00aa88' where id = $1", [space]));
    const r = await as(db, bruno, () => db.query("update public.spaces set name = 'Meu' where id = $1", [space]));
    expect(r.affectedRows ?? 0).toBe(0);
    expect((await one<{ name: string }>(db, "select name from public.spaces where id = $1", [space])).name).toBe("Terras de Vel Antiga");
  });
});
