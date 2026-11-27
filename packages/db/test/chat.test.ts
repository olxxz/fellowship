import { beforeAll, describe, expect, it } from "vitest";
import { as, createTestDb, createUser, type Db } from "./harness";

const one = async <T>(db: Db, sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows[0]!;

describe("chat completo", () => {
  let db: Db;
  let ana: string;
  let bruno: string;
  let carla: string;
  let space: string;
  let channel: string;

  beforeAll(async () => {
    db = await createTestDb();
    ana = await createUser(db, "Ana");
    bruno = await createUser(db, "Bruno");
    carla = await createUser(db, "Carla");
    space = await as(db, ana, async () => (await one<{ id: string }>(db, "select public.create_space('Vel') as id")).id);
    channel = (await one<{ id: string }>(db, "select id from public.channels where space_id = $1 and kind = 'texto' order by position limit 1", [space])).id;
    const code = await as(db, ana, async () => (await one<{ c: string }>(db, "select public.create_invite($1) as c", [space])).c);
    await as(db, bruno, () => db.query("select public.accept_invite($1)", [code]));
  });

  const post = (user: string, content: string, extra = "") =>
    as(db, user, async () => (await one<{ id: string }>(db, `insert into public.messages (space_id, channel_id, author_id, content${extra ? ", " + extra.split("=")[0] : ""}) values ($1, $2, $3, $4${extra ? ", " + extra.split("=")[1] : ""}) returning id`, [space, channel, user, content])).id);

  it("responder, editar só a própria e menção conta como não lida", async () => {
    const first = await post(ana, "Sessão sexta?");
    const reply = await as(db, bruno, async () =>
      (await one<{ id: string }>(db, "insert into public.messages (space_id, channel_id, author_id, content, reply_to, mentions) values ($1, $2, $3, 'Fechado, @ana', $4, $5) returning id", [space, channel, bruno, first, `{${ana}}`])).id,
    );
    await as(db, bruno, () => db.query("update public.messages set content = 'Fechado!! @ana', edited_at = now() where id = $1", [reply]));
    const other = await as(db, ana, async () => (await db.query("update public.messages set content = 'hack' where id = $1 returning id", [reply])).rows);
    expect(other).toHaveLength(0);

    const unread = await as(db, ana, async () => (await db.query<{ channel_id: string; unread: number; mentions: number }>("select * from public.channel_unread($1)", [space])).rows);
    expect(unread).toEqual([{ channel_id: channel, unread: 1, mentions: 1 }]);
    await as(db, ana, () => db.query("select public.mark_channel_read($1)", [channel]));
    expect(await as(db, ana, async () => (await db.query("select * from public.channel_unread($1)", [space])).rows)).toHaveLength(0);
    expect((await as(db, bruno, () => one<{ unread: number }>(db, "select unread from public.space_unread() where space_id = $1", [space]))).unread).toBe(1);
  });

  it("reações: quem vê reage; quem não é membro não vê nem reage", async () => {
    const msg = await post(ana, "Mapa novo!");
    await as(db, bruno, () => db.query("insert into public.message_reactions (message_id, user_id, emoji) values ($1, $2, '🔥')", [msg, bruno]));
    expect(await as(db, ana, async () => (await db.query("select emoji from public.message_reactions where message_id = $1", [msg])).rows)).toEqual([{ emoji: "🔥" }]);
    await expect(as(db, carla, () => db.query("insert into public.message_reactions (message_id, user_id, emoji) values ($1, $2, '👍')", [msg, carla]))).rejects.toThrow(/row-level security/);
    expect(await as(db, carla, async () => (await db.query("select 1 from public.message_reactions")).rows)).toHaveLength(0);
  });

  it("figurinhas: só quem gerencia o tema adiciona; mensagem de figurinha", async () => {
    await expect(
      as(db, bruno, () => db.query("insert into public.stickers (space_id, name, url, created_by) values ($1, 'gg', 'https://x/gg.webp', $2)", [space, bruno])),
    ).rejects.toThrow(/row-level security/);
    await as(db, ana, () => db.query("insert into public.stickers (space_id, name, url, created_by) values ($1, 'gg', 'https://x/gg.webp', $2)", [space, ana]));
    expect(await as(db, bruno, async () => (await db.query("select name from public.stickers")).rows)).toEqual([{ name: "gg" }]);
    await post(bruno, "https://x/gg.webp", "kind='figurinha'");
  });
});

describe("notificações", () => {
  it("avisa quem foi mencionado e pode ver o canal, e a outra pessoa da conversa; nunca o autor", async () => {
    const db = await createTestDb();
    const ana = await createUser(db, "Ana");
    const bruno = await createUser(db, "Bruno");
    const space = await as(db, ana, async () => (await one<{ id: string }>(db, "select public.create_space('Vel') as id")).id);
    const channel = (await one<{ id: string }>(db, "select id from public.channels where space_id = $1 and kind = 'texto' order by position limit 1", [space])).id;
    const code = await as(db, ana, async () => (await one<{ c: string }>(db, "select public.create_invite($1) as c", [space])).c);
    await as(db, bruno, () => db.query("select public.accept_invite($1)", [code]));
    for (const [u, e] of [[ana, "https://push/ana"], [bruno, "https://push/bruno"]] as const) {
      await as(db, u, () => db.query("insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, $2, 'k', 'a')", [u, e]));
    }
    // Ninguém vê a inscrição dos outros.
    expect(await as(db, ana, async () => (await db.query("select endpoint from public.push_subscriptions")).rows)).toEqual([{ endpoint: "https://push/ana" }]);
    const msg = await as(db, ana, async () =>
      (await one<{ id: string }>(db, "insert into public.messages (space_id, channel_id, author_id, content, mentions) values ($1, $2, $3, 'oi @bruno', $4) returning id", [space, channel, ana, `{${bruno},${ana}}`])).id,
    );
    const targets = (await db.query<{ endpoint: string; url: string }>("select endpoint, url from public.push_targets('canal', $1)", [msg])).rows;
    expect(targets.map((t) => t.endpoint)).toEqual(["https://push/bruno"]);
    expect(targets[0]!.url).toBe(`/c/${space}/${channel}`);
    await expect(as(db, ana, () => db.query("select * from public.push_targets('canal', $1)", [msg]))).rejects.toThrow(/permission denied/);
  });
});
