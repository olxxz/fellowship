import { describe, expect, it } from "vitest";
import { ALL_PERMISSIONS, Permission as P, resolveChannelPermissions } from "./permissions";

const member = { isOwner: false, isMember: true };

describe("resolveChannelPermissions (ADR 0014)", () => {
  it("dono tem tudo; quem não é membro não tem nada", () => {
    expect(resolveChannelPermissions({ isOwner: true, isMember: true, rolePermissions: [] })).toBe(ALL_PERMISSIONS);
    expect(resolveChannelPermissions({ isOwner: false, isMember: false, rolePermissions: [ALL_PERMISSIONS] })).toBe(0);
  });

  it("soma os cargos", () => {
    expect(resolveChannelPermissions({ ...member, rolePermissions: [P.VIEW_CHANNEL, P.SEND_MESSAGES] })).toBe(P.VIEW_CHANNEL | P.SEND_MESSAGES);
  });

  it("canal vence categoria, e o ajuste da pessoa vence o dos cargos", () => {
    const perms = resolveChannelPermissions({
      ...member,
      rolePermissions: [P.VIEW_CHANNEL | P.SEND_MESSAGES],
      category: { roles: [{ allow: 0, deny: P.VIEW_CHANNEL }] },
      channel: { roles: [{ allow: P.VIEW_CHANNEL, deny: 0 }], member: { allow: 0, deny: P.SEND_MESSAGES } },
    });
    expect(perms).toBe(P.VIEW_CHANNEL);
  });

  it("no mesmo nível, o que um cargo libera vence o que outro nega", () => {
    const perms = resolveChannelPermissions({
      ...member,
      rolePermissions: [P.VIEW_CHANNEL],
      channel: { roles: [{ allow: 0, deny: P.SEND_MESSAGES }, { allow: P.SEND_MESSAGES, deny: 0 }] },
    });
    expect(perms & P.SEND_MESSAGES).toBeTruthy();
  });

  it("sem ver canal, nada vale", () => {
    expect(resolveChannelPermissions({ ...member, rolePermissions: [P.SEND_MESSAGES | P.SPEAK] })).toBe(0);
  });
});
