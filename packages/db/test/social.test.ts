import { beforeAll, describe, expect, it } from "vitest";
import { applyMigrations, as, createTestDb, createUser, migrationFiles, type Db } from "./harness";

const one = async <T>(db: Db, sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows[0]!;

describe("nick único", () => {
  it("perfis que já existiam ganham nick; contas novas também, sem repetir", async () => {
    const files = migrationFiles();
    const idx = files.findIndex((f) => f.includes("social"));
    const db = await createTestDb({ upTo: idx });
    const a = await createUser(db, "Ana Lima");
    await applyMigrations(db, files.slice(idx));
    expect((await one<{ username: string }>(db, "select username from public.profiles where id = $1", [a])).username).toBe("ana_lima");
    // E-mail ana lima@ → o gatilho usa a parte antes do @; colisão ganha números.
    const b = await createUser(db, "Ana Lima");
    const nick = (await one<{ username: string }>(db, "select username from public.profiles where id = $1", [b])).username;
    expect(nick).toMatch(/^[a-z0-9_.]{3,20}$/);
    expect(nick).not.toBe("ana_lima");
  });

  it("o próprio troca o nick; formato inválido ou repetido é recusado", async () => {
    const db = await createTestDb();
    const a = await createUser(db, "Ana");
    const b = await createUser(db, "Bruno");
    await as(db, a, () => db.query("update public.profiles set username = 'mestre.ana' where id = $1", [a]));
    await expect(as(db, b, () => db.query("update public.profiles set username = 'mestre.ana' where id = $1", [b]))).rejects.toThrow(/duplicate|unique/);
    await expect(as(db, b, () => db.query("update public.profiles set username = 'Com Espaço' where id = $1", [b]))).rejects.toThrow(/profiles_username_format/);
  });
});

describe("amizades e conversas diretas", () => {
  let db: Db;
  let ana: string;
  let bruno: string;
  let carla: string;

  beforeAll(async () => {
    db = await createTestDb();
    ana = await createUser(db, "Ana");
    bruno = await createUser(db, "Bruno");
    carla = await createUser(db, "Carla");
    await as(db, bruno, () => db.query("update public.profiles set username = 'bruno' where id = $1", [bruno]));
    await as(db, ana, () => db.query("update public.profiles set username = 'ana' where id = $1", [ana]));
  });

  it("estranhos não se veem, mas acham o cartão pelo nick", async () => {
    const seen = await as(db, ana, async () => (await db.query("select id from public.profiles where id = $1", [bruno])).rows);
    expect(seen).toHaveLength(0);
    const card = await as(db, ana, () => one<{ display_name: string; friendship: string }>(db, "select * from public.find_profile('@Bruno')"));
    expect(card).toMatchObject({ display_name: "Bruno", friendship: "nenhuma" });
  });

  it("pedido pelo nick, aceite e conversa só entre amigos", async () => {
    expect((await as(db, ana, () => one<{ r: string }>(db, "select public.request_friend('bruno') as r"))).r).toBe("enviado");
    expect((await as(db, bruno, () => one<{ friendship: string }>(db, "select friendship from public.find_profile('ana')"))).friendship).toBe("recebido");
    // Antes de aceitar, ninguém escreve.
    const [a, b] = [ana, bruno].sort();
    await expect(
      as(db, ana, () => db.query("insert into public.direct_messages (user_a, user_b, author_id, content) values ($1, $2, $3, 'oi')", [a, b, ana])),
    ).rejects.toThrow(/row-level security/);
    await as(db, bruno, () => db.query("select public.respond_friend($1, true)", [ana]));
    await as(db, ana, () => db.query("insert into public.direct_messages (user_a, user_b, author_id, content) values ($1, $2, $3, 'oi, Bruno')", [a, b, ana]));
    const read = await as(db, bruno, async () => (await db.query<{ content: string }>("select content from public.direct_messages")).rows);
    expect(read.map((r) => r.content)).toEqual(["oi, Bruno"]);
    // Terceiros não leem.
    expect(await as(db, carla, async () => (await db.query("select 1 from public.direct_messages")).rows)).toHaveLength(0);
    // Amigos veem o perfil um do outro.
    expect(await as(db, ana, async () => (await db.query("select 1 from public.profiles where id = $1", [bruno])).rows)).toHaveLength(1);
  });

  it("pedido cruzado vira amizade na hora; não dá para pedir a si mesmo", async () => {
    await as(db, carla, () => db.query("select public.request_friend('ana')"));
    expect((await as(db, ana, async () => (await one<{ r: string }>(db, `select public.request_friend((select username from public.profiles where id = '${carla}')) as r`)).r))).toBe("amigos");
    await expect(as(db, ana, () => db.query("select public.request_friend('ana')"))).rejects.toThrow(/é o seu/);
    await as(db, ana, () => db.query("select public.remove_friend($1)", [carla]));
    expect((await as(db, ana, () => one<{ n: number }>(db, "select count(*)::int as n from public.friendships"))).n).toBe(1);
  });
});

describe("Cenários públicos", () => {
  it("aparecem em Explorar e qualquer conta entra; privados não", async () => {
    const db = await createTestDb();
    const ana = await createUser(db, "Ana");
    const bruno = await createUser(db, "Bruno");
    const pub = await as(db, ana, async () => (await one<{ id: string }>(db, "select public.create_space('Taverna Aberta') as id")).id);
    const priv = await as(db, ana, async () => (await one<{ id: string }>(db, "select public.create_space('Mesa Fechada') as id")).id);
    await as(db, ana, () => db.query("update public.spaces set is_public = true where id = $1", [pub]));

    const list = await as(db, bruno, async () => (await db.query<{ id: string; is_member: boolean; member_count: number }>("select * from public.list_public_spaces()")).rows);
    expect(list.map((s) => s.id)).toEqual([pub]);
    expect(list[0]).toMatchObject({ is_member: false, member_count: 1 });

    await as(db, bruno, () => db.query("select public.join_public_space($1)", [pub]));
    expect(await as(db, bruno, async () => (await db.query("select 1 from public.spaces where id = $1", [pub])).rows)).toHaveLength(1);
    await expect(as(db, bruno, () => db.query("select public.join_public_space($1)", [priv]))).rejects.toThrow(/não é público/);
    // Quem não gerencia o tema não muda a visibilidade.
    await expect(as(db, bruno, async () => {
      const r = await db.query("update public.spaces set is_public = false where id = $1 returning id", [pub]);
      if (r.rows.length === 0) throw new Error("sem permissão");
    })).rejects.toThrow(/sem permissão/);
  });
});

describe("boas-vindas", () => {
  it("conta nova começa sem boas-vindas; nick livre ou ocupado", async () => {
    const db = await createTestDb();
    const ana = await createUser(db, "Ana");
    const bruno = await createUser(db, "Bruno");
    expect((await one<{ onboarded: boolean }>(db, "select onboarded from public.profiles where id = $1", [ana])).onboarded).toBe(false);
    await as(db, ana, () => db.query("update public.profiles set username = 'mestre', onboarded = true where id = $1", [ana]));
    expect((await as(db, bruno, () => one<{ ok: boolean }>(db, "select public.username_available('mestre') as ok"))).ok).toBe(false);
    expect((await as(db, ana, () => one<{ ok: boolean }>(db, "select public.username_available('mestre') as ok"))).ok).toBe(true);
    expect((await as(db, bruno, () => one<{ ok: boolean }>(db, "select public.username_available('Tem Espaço') as ok"))).ok).toBe(false);
  });
});
