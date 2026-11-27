import { beforeAll, describe, expect, it } from "vitest";
import { as, createTestDb, createUser, type Db } from "./harness";

const one = async <T>(db: Db, sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows[0]!;
const all = async <T>(db: Db, sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows;

describe("mesa: cena, sessões e modelos de ficha", () => {
  let db: Db;
  let ana: string; // dona e mestre
  let bruno: string; // jogador
  let carla: string; // fora do Cenário
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
    campaign = await as(db, ana, async () => (await one<{ id: string }>(db, "select public.create_campaign($1, 'A Maldição') as id", [space])).id);
    mesa = (await one<{ id: string }>(db, "select id from public.channels where campaign_id = $1 and name = 'mesa'", [campaign])).id;
    await as(db, ana, () => db.query("select public.set_campaign_member($1, $2, 'jogador')", [campaign, bruno]));
  });

  it("só o mestre muda a cena", async () => {
    await as(db, ana, () => db.query("select public.set_campaign_scene($1, 'A taverna', 'https://x/y.jpg')", [campaign]));
    expect(await one(db, "select scene_name, scene_url from public.campaigns where id = $1", [campaign])).toEqual({ scene_name: "A taverna", scene_url: "https://x/y.jpg" });
    await expect(as(db, bruno, () => db.query("select public.set_campaign_scene($1, 'x', null)", [campaign]))).rejects.toThrow(/Só o mestre/);
  });

  it("sessões: numeradas, uma aberta por vez, e as mensagens ficam marcadas com a sessão", async () => {
    await as(db, bruno, () => db.query("insert into public.messages (space_id, channel_id, author_id, content) values ($1, $2, $3, 'antes')", [space, mesa, bruno]));
    expect((await as(db, ana, () => one<{ n: number }>(db, "select public.start_session($1, 'O começo') as n", [campaign]))).n).toBe(1);
    await as(db, bruno, () => db.query("insert into public.messages (space_id, channel_id, author_id, content) values ($1, $2, $3, 'durante')", [space, mesa, bruno]));
    expect((await as(db, ana, () => one<{ n: number }>(db, "select public.start_session($1) as n", [campaign]))).n).toBe(2);
    expect(await all(db, "select 1 from public.campaign_sessions where campaign_id = $1 and ended_at is null", [campaign])).toHaveLength(1);
    const rows = await all<{ content: string; number: number | null }>(
      db,
      "select m.content, s.number from public.messages m left join public.campaign_sessions s on s.id = m.session_id where m.channel_id = $1 order by m.created_at",
      [mesa],
    );
    expect(rows).toEqual([
      { content: "antes", number: null },
      { content: "durante", number: 1 },
    ]);
    await expect(as(db, bruno, () => db.query("select public.start_session($1)", [campaign]))).rejects.toThrow(/Só o mestre/);
    expect(await as(db, bruno, () => all(db, "select 1 from public.campaign_sessions"))).toHaveLength(2);
    expect(await as(db, carla, () => all(db, "select 1 from public.campaign_sessions"))).toHaveLength(0);
    await as(db, ana, () => db.query("select public.end_session($1)", [campaign]));
    expect(await all(db, "select 1 from public.campaign_sessions where ended_at is null")).toHaveLength(0);
  });

  it("modelos de ficha: do dono; o mestre usa o dele na campanha e quem joga passa a ler", async () => {
    const tpl = await as(db, ana, async () => (await one<{ id: string }>(db, "insert into public.sheet_templates (name, base, config) values ('Minha ficha', 'dnd2024', '{}') returning id")).id);
    expect(await as(db, bruno, () => all(db, "select 1 from public.sheet_templates"))).toHaveLength(0);
    await as(db, ana, () => db.query("select public.set_campaign_template($1, 'homebrew', $2)", [campaign, tpl]));
    expect(await one(db, "select system, template_id from public.campaigns where id = $1", [campaign])).toEqual({ system: "dnd2024", template_id: tpl });
    expect(await as(db, bruno, () => all(db, "select name from public.sheet_templates"))).toEqual([{ name: "Minha ficha" }]);
    // O jogador não edita o modelo do mestre nem usa um modelo dele na campanha.
    await as(db, bruno, () => db.query("update public.sheet_templates set name = 'x' where id = $1", [tpl]));
    expect((await one<{ name: string }>(db, "select name from public.sheet_templates where id = $1", [tpl])).name).toBe("Minha ficha");
    const other = await as(db, bruno, async () => (await one<{ id: string }>(db, "insert into public.sheet_templates (name, base) values ('Do Bruno', 'homebrew') returning id")).id);
    await expect(as(db, bruno, () => db.query("select public.set_campaign_template($1, 'homebrew', $2)", [campaign, other]))).rejects.toThrow(/Só o mestre/);
    await expect(as(db, ana, () => db.query("select public.set_campaign_template($1, 'homebrew', $2)", [campaign, other]))).rejects.toThrow(/não encontrado/);
    await as(db, ana, () => db.query("select public.set_campaign_template($1, 'homebrew', null)", [campaign]));
    expect(await one(db, "select system, template_id from public.campaigns where id = $1", [campaign])).toEqual({ system: "homebrew", template_id: null });
  });
});
