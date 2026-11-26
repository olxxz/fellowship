import type { MemberEntry } from "@/components/shell/MembersList";
import { characterById, users, type DemoCampaign } from "@/lib/demo/data";

/** Membros do Cenário, agrupados por cargo; offline no fim. */
export function spaceMemberGroups() {
  const entry = (u: (typeof users)[number]): MemberEntry => ({ id: u.id, name: u.name, color: u.color, status: u.status, sub: u.activity });
  const online = users.filter((u) => u.status !== "offline");
  return [
    { title: "Narrador", members: online.filter((u) => u.role === "narrador").map(entry) },
    { title: "Mesa de Quinta", members: online.filter((u) => u.role === "mesa").map(entry) },
    { title: "Membros", members: online.filter((u) => u.role === "membro").map(entry) },
    { title: "Offline", members: users.filter((u) => u.status === "offline").map(entry) },
  ];
}

/** Membros da campanha: o personagem em primeiro plano, o jogador embaixo. */
export function campaignMemberGroups(campaign: DemoCampaign) {
  const master = users.find((u) => u.id === campaign.masterId)!;
  return [
    { title: "Mestre", members: [{ id: master.id, name: master.name, color: master.color, status: master.status, sub: "Narrador" }] },
    {
      title: "Personagens",
      members: campaign.characterIds.map((id): MemberEntry => {
        const ch = characterById(id)!;
        const owner = users.find((u) => u.id === ch.ownerId)!;
        return { id: ch.id, name: ch.name, color: ch.color, status: owner.status, sub: owner.name, asCharacter: true };
      }),
    },
  ];
}
