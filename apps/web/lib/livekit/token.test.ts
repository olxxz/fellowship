import { describe, expect, it } from "vitest";
import { createMesaToken, mesaRoomName, TokenRequestError } from "./token";

const env = { LIVEKIT_API_KEY: "APItest", LIVEKIT_API_SECRET: "segredo-de-teste-com-tamanho-suficiente-123" };
const room = mesaRoomName("vel", "maldicao");

function payload(jwt: string) {
  return JSON.parse(Buffer.from(jwt.split(".")[1]!, "base64url").toString());
}

describe("createMesaToken", () => {
  it("gera token só para a sala pedida, com o usuário nos atributos", async () => {
    const { token, identity } = await createMesaToken({ room, userId: "ana" }, env);
    const claims = payload(token);
    expect(identity).toMatch(/^ana-[0-9a-f]{6}$/);
    expect(claims.sub).toBe(identity);
    expect(claims.name).toBe("Ana");
    expect(claims.attributes).toEqual({ userId: "ana" });
    expect(claims.video).toMatchObject({ room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: false });
    expect(claims.exp - claims.nbf).toBeLessThanOrEqual(2 * 60 * 60);
  });

  it("recusa sala desconhecida ou campanha sem sessão ao vivo", async () => {
    await expect(createMesaToken({ room: "outra-sala", userId: "ana" }, env)).rejects.toMatchObject({ status: 400 });
    await expect(createMesaToken({ room: mesaRoomName("vel", "karn"), userId: "ana" }, env)).rejects.toBeInstanceOf(TokenRequestError);
  });

  it("recusa usuário desconhecido", async () => {
    await expect(createMesaToken({ room, userId: "intruso" }, env)).rejects.toMatchObject({ status: 400 });
    await expect(createMesaToken(null, env)).rejects.toMatchObject({ status: 400 });
  });

  it("avisa quando faltam as variáveis no servidor", async () => {
    await expect(createMesaToken({ room, userId: "ana" }, {})).rejects.toMatchObject({ status: 503 });
  });
});
