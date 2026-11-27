import { describe, expect, it } from "vitest";
import { as, createTestDb, createUser, type Db } from "./harness";

const one = async <T>(db: Db, sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows[0]!;

describe("anexos", () => {
  it("mensagem pode ser só anexo; quem vê o canal lê o anexo, quem não é membro não", async () => {
    const db = await createTestDb();
    const ana = await createUser(db, "Ana");
    const bruno = await createUser(db, "Bruno");
    const space = await as(db, ana, async () => (await one<{ id: string }>(db, "select public.create_space('Vel') as id")).id);
    const channel = (await one<{ id: string }>(db, "select id from public.channels where space_id = $1 and kind = 'texto' order by position limit 1", [space])).id;
    await as(db, ana, () =>
      db.query("insert into public.messages (space_id, channel_id, author_id, content, attachments) values ($1, $2, $3, '', $4)", [
        space,
        channel,
        ana,
        JSON.stringify([{ path: `c/${channel}/x/mapa.webp`, name: "mapa.webp", size: 10, mime: "image/webp" }]),
      ]),
    );
    await expect(
      as(db, ana, () => db.query("insert into public.messages (space_id, channel_id, author_id, content) values ($1, $2, $3, '')", [space, channel, ana])),
    ).rejects.toThrow(/messages_content_check/);

    const path = `c/${channel}/x/mapa.webp`;
    expect((await as(db, ana, () => one<{ ok: boolean }>(db, "select private.can_read_attachment($1, $2) as ok", [path, ana]))).ok).toBe(true);
    expect((await as(db, bruno, () => one<{ ok: boolean }>(db, "select private.can_read_attachment($1, $2) as ok", [path, bruno]))).ok).toBe(false);
    expect((await as(db, ana, () => one<{ ok: boolean }>(db, "select private.can_write_attachment($1, $2) as ok", [path, ana]))).ok).toBe(true);
    expect((await as(db, ana, () => one<{ ok: boolean }>(db, "select private.can_read_attachment('qualquer/coisa', $1) as ok", [ana]))).ok).toBe(false);
  });

  it("na conversa direta só as duas pessoas leem, e só amigos sobem", async () => {
    const db = await createTestDb();
    const a = await createUser(db, "Ana");
    const b = await createUser(db, "Bruno");
    const c = await createUser(db, "Carla");
    const [x, y] = [a, b].sort();
    const path = `d/${x}_${y}/u/foto.gif`;
    expect((await as(db, a, () => one<{ ok: boolean }>(db, "select private.can_write_attachment($1, $2) as ok", [path, a]))).ok).toBe(false);
    const nick = (await one<{ username: string }>(db, "select username from public.profiles where id = $1", [b])).username;
    await as(db, a, () => db.query("select public.request_friend($1)", [nick]));
    await as(db, b, () => db.query("select public.respond_friend($1, true)", [a]));
    expect((await as(db, a, () => one<{ ok: boolean }>(db, "select private.can_write_attachment($1, $2) as ok", [path, a]))).ok).toBe(true);
    expect((await as(db, c, () => one<{ ok: boolean }>(db, "select private.can_read_attachment($1, $2) as ok", [path, c]))).ok).toBe(false);
    expect((await as(db, b, () => one<{ ok: boolean }>(db, "select private.can_read_attachment($1, $2) as ok", [path, b]))).ok).toBe(true);
  });
});
