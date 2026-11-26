import { Permission as P, resolveChannelPermissions } from "@fellowship/core";
import { beforeAll, describe, expect, it } from "vitest";
import { as, createTestDb, createUser, type Db } from "./harness";

let db: Db;
let ana: string; // dona do Cenário
let bruno: string; // entra como membro
let carla: string; // de fora
let space: string;
const channel: Record<string, string> = {};
let memberRole: string;
let defaultRole: string;

const one = async <T>(sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows[0]!;
const all = async <T>(sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows;

beforeAll(async () => {
  db = await createTestDb();
  ana = await createUser(db, "Ana Souza", { avatar_url: "https://exemplo.com/ana.png" });
  bruno = await createUser(db, "Bruno");
  carla = await createUser(db, "Carla");
  space = await as(db, ana, async () => (await one<{ id: string }>("select public.create_space('Terras de Vel', 'Pontes e névoa', 4::smallint, 'padrao') as id")).id);
  for (const c of await all<{ id: string; name: string }>("select id, name from public.channels where space_id = $1", [space])) channel[c.name] = c.id;
  memberRole = (await one<{ id: string }>("select id from public.roles where space_id = $1 and name = 'Membro'", [space])).id;
  defaultRole = (await one<{ id: string }>("select id from public.roles where space_id = $1 and is_default", [space])).id;
});

describe("perfil automático", () => {
  it("nasce do Google com nome, foto e cor de personagem", async () => {
    const p = await one<{ display_name: string; avatar_url: string; color: number }>("select * from public.profiles where id = $1", [ana]);
    expect(p.display_name).toBe("Ana Souza");
    expect(p.avatar_url).toBe("https://exemplo.com/ana.png");
    expect(p.color).toBeGreaterThanOrEqual(1);
    expect(p.color).toBeLessThanOrEqual(6);
  });

  it("sem nome no Google, usa o começo do e-mail", async () => {
    const { rows } = await db.query<{ id: string }>("insert into auth.users (email) values ('dani.rpg@exemplo.com') returning id");
    expect((await one<{ display_name: string }>("select display_name from public.profiles where id = $1", [rows[0]!.id])).display_name).toBe("dani.rpg");
  });
});

describe("criar Cenário", () => {
  it("cria Cenário, iniciais, cargos, categorias e canais do modelo padrão", async () => {
    const s = await one<{ name: string; short: string; owner_id: string }>("select * from public.spaces where id = $1", [space]);
    expect(s).toMatchObject({ name: "Terras de Vel", short: "TV", owner_id: ana });
    const roles = await all<{ name: string }>("select name from public.roles where space_id = $1 order by position desc", [space]);
    expect(roles.map((r) => r.name)).toEqual(["Administrador", "Narrador", "Membro", "Visitante"]);
    expect(Object.keys(channel).sort()).toEqual(["Agenda", "Anúncios", "Arte e fichas", "Geral", "Regras", "Taverna"]);
  });

  it("modelo vazio tem só o Geral", async () => {
    const id = await as(db, bruno, async () => (await one<{ id: string }>("select public.create_space('Neon Rio', null, 5::smallint, 'vazio') as id")).id);
    expect(await all("select name from public.channels where space_id = $1", [id])).toEqual([{ name: "Geral" }]);
    await db.query("delete from public.spaces where id = $1", [id]);
  });

  it("valida nome e exige login", async () => {
    await expect(as(db, ana, () => db.query("select public.create_space('X')"))).rejects.toThrow(/entre 2 e 60/);
    await expect(as(db, null, () => db.query("select public.create_space('Terras')"))).rejects.toThrow(/permission denied|permissão/);
  });

  it("não deixa criar Cenário direto na tabela", async () => {
    await expect(as(db, ana, () => db.query("insert into public.spaces (name, short, owner_id) values ('Atalho', 'A', $1)", [ana]))).rejects.toThrow();
  });
});

describe("cada conta vê só o que pode", () => {
  it("quem não é membro não vê Cenário, canais, mensagens nem perfis", async () => {
    await as(db, ana, () => db.query("insert into public.messages (space_id, channel_id, author_id, content) values ($1, $2, $3, 'Olá, mesa!')", [space, channel.Geral, ana]));
    await as(db, carla, async () => {
      expect(await all("select * from public.spaces")).toEqual([]);
      expect(await all("select * from public.channels")).toEqual([]);
      expect(await all("select * from public.messages")).toEqual([]);
      expect(await all("select id from public.profiles where id = $1", [ana])).toEqual([]);
      expect((await one<{ p: number }>("select public.channel_permissions($1) as p", [channel.Geral])).p).toBe(0);
    });
  });

  it("anônimo não lê nada", async () => {
    await expect(as(db, null, () => db.query("select * from public.spaces"))).rejects.toThrow(/permission denied/);
  });

  it("não deixa postar onde não pode", async () => {
    await expect(
      as(db, carla, () => db.query("insert into public.messages (space_id, channel_id, author_id, content) values ($1, $2, $3, 'invasão')", [space, channel.Geral, carla])),
    ).rejects.toThrow(/row-level security/);
  });

  it("visitante (cargo padrão) lê, mas não escreve", async () => {
    await db.query("insert into public.space_members (space_id, user_id) values ($1, $2)", [space, bruno]);
    await as(db, bruno, async () => {
      expect((await all("select id from public.spaces")).length).toBe(1);
      expect((await all("select content from public.messages"))).toEqual([{ content: "Olá, mesa!" }]);
      expect((await all("select id from public.profiles where id = $1", [ana])).length).toBe(1);
      await expect(db.query("insert into public.messages (space_id, channel_id, author_id, content) values ($1, $2, $3, 'oi')", [space, channel.Geral, bruno])).rejects.toThrow(/row-level security/);
    });
  });

  it("membro escreve no Geral, mas anúncios só com permissão de publicar", async () => {
    await db.query("insert into public.member_roles (space_id, user_id, role_id) values ($1, $2, $3)", [space, bruno, memberRole]);
    await as(db, bruno, async () => {
      await db.query("insert into public.messages (space_id, channel_id, author_id, content) values ($1, $2, $3, 'Cheguei!')", [space, channel.Geral, bruno]);
      await expect(db.query("insert into public.messages (space_id, channel_id, author_id, content) values ($1, $2, $3, 'aviso')", [space, channel["Anúncios"], bruno])).rejects.toThrow(/row-level security/);
      await expect(db.query("insert into public.messages (space_id, channel_id, author_id, content) values ($1, $2, $3, 'eu sou a Ana')", [space, channel.Geral, ana])).rejects.toThrow(/row-level security/);
      await expect(db.query("insert into public.messages (space_id, channel_id, author_id, content) values ($1, $2, $3, 'chat na regra')", [space, channel.Regras, bruno])).rejects.toThrow(/row-level security/);
    });
    await as(db, ana, () => db.query("insert into public.messages (space_id, channel_id, author_id, content) values ($1, $2, $3, 'Sessão quinta!')", [space, channel["Anúncios"], ana]));
  });

  it("ajustes de categoria e canal escondem e liberam canais (ADR 0014)", async () => {
    const mural = (await one<{ id: string }>("select id from public.categories where space_id = $1 and name = 'Mural'", [space])).id;
    // A categoria Mural fica escondida para todos; o canal Agenda é liberado de novo só para o Bruno.
    await db.query("insert into public.permission_overrides (space_id, category_id, role_id, deny) values ($1, $2, $3, $4)", [space, mural, defaultRole, P.VIEW_CHANNEL]);
    await db.query("insert into public.permission_overrides (space_id, channel_id, user_id, allow) values ($1, $2, $3, $4)", [space, channel.Agenda, bruno, P.VIEW_CHANNEL]);
    await as(db, bruno, async () => {
      const names = (await all<{ name: string }>("select name from public.channels order by name")).map((c) => c.name);
      expect(names).toEqual(["Agenda", "Arte e fichas", "Geral", "Taverna"]);
      expect(await all("select * from public.messages where channel_id = $1", [channel["Anúncios"]])).toEqual([]);
      // Ajustes só são visíveis para quem gerencia canais.
      expect(await all("select * from public.permission_overrides")).toEqual([]);
    });
    await as(db, ana, async () => expect((await all("select id from public.channels")).length).toBe(6));
    await db.query("delete from public.permission_overrides where space_id = $1", [space]);
  });

  it("o banco resolve igual a packages/core", async () => {
    const sql = await as(db, bruno, async () => (await one<{ p: number }>("select public.channel_permissions($1) as p", [channel.Geral])).p);
    const roles = await all<{ permissions: number }>("select permissions from public.roles where id in ($1, $2)", [defaultRole, memberRole]);
    expect(sql).toBe(resolveChannelPermissions({ isOwner: false, isMember: true, rolePermissions: roles.map((r) => r.permissions) }));
    expect(await as(db, ana, async () => (await one<{ p: number }>("select public.channel_permissions($1) as p", [channel.Geral])).p)).toBe(2047);
  });

  it("não deixa o membro editar o Cenário de outra pessoa nem trocar o dono", async () => {
    await as(db, bruno, async () => {
      const r = await db.query("update public.spaces set name = 'Meu agora' where id = $1", [space]);
      expect(r.affectedRows ?? 0).toBe(0);
      await expect(db.query("update public.spaces set owner_id = $1 where id = $2", [bruno, space])).rejects.toThrow(/permission denied/);
    });
  });

  it("mensagens estão na publicação do Realtime", async () => {
    expect(await all("select tablename from pg_publication_tables where pubname = 'supabase_realtime'")).toEqual([{ tablename: "messages" }]);
  });
});
