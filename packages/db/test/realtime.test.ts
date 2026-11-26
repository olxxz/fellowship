import { describe, expect, it } from "vitest";
import { createTestDb } from "./harness";

describe("realtime das mensagens", () => {
  it("messages fica na publicação do Realtime com a linha antiga completa nos DELETEs", async () => {
    const db = await createTestDb();
    const { rows } = await db.query<{ tablename: string }>(
      "select tablename from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public'",
    );
    expect(rows.map((r) => r.tablename)).toContain("messages");
    const ident = await db.query<{ relreplident: string }>("select relreplident from pg_class where oid = 'public.messages'::regclass");
    expect(ident.rows[0]?.relreplident).toBe("f");
  });
});
