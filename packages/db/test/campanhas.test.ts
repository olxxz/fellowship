import { beforeAll, describe, expect, it } from "vitest";
import { as, createTestDb, createUser, type Db } from "./harness";

const one = async <T>(db: Db, sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows[0]!;
const all = async <T>(db: Db, sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows;

describe("campanhas, personagens e rolagens ocultas", () => {
  let db: Db;
  let ana: string; // dona do Cenário e mestre
  let bruno: string; // jogador
  let carla: string; // membro do Cenário, fora da campanha
  let space: string;
  let campaign: string;
  let mesa: string;

  beforeAll(async () => {
    db = await createTestDb();
    ana = await createUser(db, "Ana");
    bruno = await createUser(db, "Bruno");
    carla = await createUser(db, "Carla");
    space = await as(db, ana, async () => (await one<{ id: string }>(db, "select public.create_space('Vel') as id")).id);
    const code = await as(db, ana, async () => (await one<{ c: string }>(db, "select public.create_invite($1) as c", [space])).c);
    await as(db, bruno, () => db.query("select public.accept_invite($1)", [code]));
    await as(db, carla, () => db.query("select public.accept_invite($1)", [code]));
    campaign = await as(db, ana, async () => (await one<{ id: string }>(db, "select public.create_campaign($1, 'A Maldição', null, '#c08a3e', 'homebrew') as id", [space])).id);
    mesa = (await one<{ id: string }>(db, "select id from public.channels where campaign_id = $1 and name = 'mesa'", [campaign])).id;
    await as(db, ana, () => db.query("select public.set_campaign_member($1, $2, 'jogador')", [campaign, bruno]));
  });

  it("criar campanha precisa da permissão; já nascem mesa, fora-de-jogo e voz", async () => {
    expect((await all<{ name: string }>(db, "select name from public.channels where campaign_id = $1 order by position", [campaign])).map((r) => r.name)).toEqual(["mesa", "fora-de-jogo", "Voz da mesa"]);
    // Membro padrão não tem Criar campanhas.
    await expect(as(db, carla, () => db.query("select public.create_campaign($1, 'X')", [space]))).rejects.toThrow(/não pode criar campanhas/);
  });

  it("canais da campanha: só quem joga vê; espectador vê mas não escreve", async () => {
    expect(await as(db, bruno, () => all(db, "select id from public.channels where id = $1", [mesa]))).toHaveLength(1);
    expect(await as(db, carla, () => all(db, "select id from public.channels where id = $1", [mesa]))).toHaveLength(0);
    await as(db, carla, () => db.query("select public.join_campaign($1, 'espectador')", [campaign]));
    expect(await as(db, carla, () => all(db, "select id from public.channels where id = $1", [mesa]))).toHaveLength(1);
    await expect(
      as(db, carla, () => db.query("insert into public.messages (space_id, channel_id, author_id, content) values ($1, $2, $3, 'oi')", [space, mesa, carla])),
    ).rejects.toThrow(/row-level security/);
    await expect(as(db, carla, () => db.query("select public.join_campaign($1, 'jogador')", [campaign]))).rejects.toThrow(/fechada/);
  });

  it("personagens: jogador cria o próprio; NPC escondido só o mestre vê; só o mestre muda o dono", async () => {
    const pc = await as(db, bruno, async () =>
      (await one<{ id: string }>(db, "insert into public.characters (campaign_id, owner_id, name, sheet) values ($1, $2, 'Bjørn', '{\"classe\":\"Bárbaro\"}') returning id", [campaign, bruno])).id,
    );
    await as(db, ana, () => db.query("insert into public.characters (campaign_id, kind, name, revealed) values ($1, 'npc', 'Lady Saphira', false)", [campaign]));
    expect((await as(db, bruno, () => all<{ name: string }>(db, "select name from public.characters order by name"))).map((r) => r.name)).toEqual(["Bjørn"]);
    expect(await as(db, ana, () => all(db, "select name from public.characters"))).toHaveLength(2);
    await as(db, bruno, () => db.query("update public.characters set sheet = '{\"classe\":\"Bárbaro\",\"nivel\":8}' where id = $1", [pc]));
    await expect(as(db, bruno, () => db.query("update public.characters set owner_id = $2 where id = $1", [pc, carla]))).rejects.toThrow(/Só o mestre/);
    // Quem não é da campanha não vê.
    await as(db, carla, () => db.query("select public.leave_campaign($1)", [campaign]));
    expect(await as(db, carla, () => all(db, "select 1 from public.characters"))).toHaveLength(0);
  });

  it("rolagem oculta: só o autor e o mestre veem; usuário não grava rolagem", async () => {
    // O servidor (papel sem RLS) grava a rolagem oculta do Bruno.
    await db.query("insert into public.messages (space_id, channel_id, author_id, kind, content, visibility) values ($1, $2, $3, 'rolagem', '{}', 'mestre')", [space, mesa, bruno]);
    const see = async (u: string) => (await as(db, u, () => all(db, "select 1 from public.messages where channel_id = $1 and kind = 'rolagem'", [mesa]))).length;
    expect(await see(bruno)).toBe(1);
    expect(await see(ana)).toBe(1);
    await as(db, carla, () => db.query("select public.join_campaign($1, 'espectador')", [campaign]));
    expect(await see(carla)).toBe(0);
    await expect(
      as(db, bruno, () => db.query("insert into public.messages (space_id, channel_id, author_id, kind, content) values ($1, $2, $3, 'rolagem', '{}')", [space, mesa, bruno])),
    ).rejects.toThrow(/row-level security/);
  });

  it("sair do Cenário tira das campanhas", async () => {
    await as(db, bruno, () => db.query("select public.leave_space($1)", [space]));
    expect(await all(db, "select 1 from public.campaign_members where user_id = $1", [bruno])).toHaveLength(0);
  });
});
