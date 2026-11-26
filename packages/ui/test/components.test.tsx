import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, ButtonLink, CampaignCard, ChannelCategory, ChannelRow, IconButton, ParticipantCard, RollCard, SkeletonRegion } from "../src";

describe("Button", () => {
  it("dispara o clique e usa a variante", async () => {
    const onClick = vi.fn();
    render(
      <Button variant="mesa" icon="dice" onClick={onClick}>
        Rolar 1d20 + 4
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Rolar 1d20 + 4" });
    expect(button).toHaveClass("mesa");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("ignora o clique enquanto carrega e marca aria-busy", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Salvar
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Salvar" });
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("botão só de ícone tem nome acessível", () => {
    render(<IconButton icon="micOff" label="Desmutar" />);
    expect(screen.getByRole("button", { name: "Desmutar" })).toBeInTheDocument();
  });
});

describe("ChannelRow", () => {
  it("marca o canal ativo e o não lido", () => {
    render(
      <>
        <ChannelRow icon="chat" name="Geral" active href="/geral" />
        <ChannelRow icon="announcement" name="Anúncios" unread />
      </>,
    );
    expect(screen.getByRole("link", { name: "Geral" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: /Anúncios.*não lido/ })).toBeInTheDocument();
  });

  it("categoria recolhe as linhas", async () => {
    render(
      <ChannelCategory name="Conversa">
        <ChannelRow icon="chat" name="Geral" />
      </ChannelCategory>,
    );
    const header = screen.getByRole("button", { name: "Conversa" });
    expect(header).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Geral" })).not.toBeInTheDocument();
  });
});

describe("CampaignCard", () => {
  it("ao vivo mostra até 3 avatares e anuncia o resto", () => {
    render(
      <CampaignCard
        name="A Maldição de Vel"
        live={{
          session: 12,
          participants: [
            { name: "Kael", color: 1 },
            { name: "Brom", color: 2 },
            { name: "Lia", color: 3 },
            { name: "Nyx", color: 5 },
            { name: "Oren", color: 6 },
          ],
        }}
      />,
    );
    expect(screen.getByText("Ao vivo · Sessão 12")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getByText(/Na Mesa: Kael, Brom, Lia e mais 2/)).toBeInTheDocument();
  });

  it("fora de sessão mostra a próxima data", () => {
    render(<CampaignCard name="Ecos de Karn" icon="map" color={1} nextSession="sáb 15h" />);
    expect(screen.getByText("Próxima: sáb 15h")).toBeInTheDocument();
  });
});

describe("ParticipantCard", () => {
  it("anuncia quem está falando, não só pela cor", () => {
    render(<ParticipantCard characterName="Kael" playerName="Ana" color={1} speaking />);
    expect(screen.getByRole("status")).toHaveTextContent("Kael está falando");
    expect(screen.getByText("falando")).toBeInTheDocument();
  });

  it("mutado mostra rótulo e não anuncia fala", () => {
    render(<ParticipantCard characterName="Brom" playerName="Bruno" color={2} speaking muted />);
    expect(screen.getByText("mutado")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});

describe("RollCard", () => {
  it("mostra fórmula, dados e total", () => {
    render(<RollCard roller="Brom" label="Atletismo" formula="1d20 + 4" dice={[{ value: 15 }]} modifier={4} total={19} color={2} />);
    expect(screen.getByText("Brom rolou Atletismo")).toBeInTheDocument();
    expect(screen.getByText("1d20 + 4 → [15] + 4")).toBeInTheDocument();
    expect(screen.getByLabelText("Total 19")).toBeInTheDocument();
  });

  it("vantagem risca o dado descartado e crítico ganha rótulo", () => {
    render(
      <RollCard
        roller="Kael"
        formula="2d20kh1 + 4"
        dice={[{ value: 20 }, { value: 8, discarded: true }]}
        modifier={4}
        total={24}
        critical={{ kind: "success", label: "20 natural" }}
      />,
    );
    expect(screen.getByText("descartado")).toBeInTheDocument();
    expect(screen.getByText("20 natural")).toBeInTheDocument();
  });

  it("oculta esconde o total do jogador, mas não do mestre", () => {
    const props = { roller: "Narrador", formula: "1d20", dice: [{ value: 7 }], total: 7, hidden: true };
    const { rerender } = render(<RollCard {...props} />);
    expect(screen.getByText("Só o mestre vê o resultado")).toBeInTheDocument();
    expect(screen.queryByText("1d20 → [7]")).not.toBeInTheDocument();
    rerender(<RollCard {...props} viewerIsMaster />);
    expect(screen.getByLabelText("Total 7")).toBeInTheDocument();
    expect(screen.getByText("Oculta")).toBeInTheDocument();
  });
});

describe("SkeletonRegion", () => {
  it("marca aria-busy e anuncia o carregamento", () => {
    const { rerender } = render(
      <SkeletonRegion loading fallback={<ChannelRow.Skeleton />}>
        <p>Conteúdo</p>
      </SkeletonRegion>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Carregando…");
    expect(screen.queryByText("Conteúdo")).not.toBeInTheDocument();
    rerender(
      <SkeletonRegion loading={false} fallback={<ChannelRow.Skeleton />}>
        <p>Conteúdo</p>
      </SkeletonRegion>,
    );
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
  });
});

describe("ParticipantCard fora da chamada", () => {
  it("mostra o status e não anuncia fala", () => {
    render(<ParticipantCard characterName="Nyx" playerName="Dani" color={5} offline speaking />);
    expect(screen.getByText("fora da chamada")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});

describe("ParticipantCard portrait", () => {
  it("só o retrato: sem nomes visíveis, mas com rótulo acessível e anúncio de fala", () => {
    render(<ParticipantCard variant="portrait" characterName="Kael" playerName="Ana" color={1} speaking />);
    expect(screen.getByRole("article", { name: "Kael, jogado por Ana" })).toBeInTheDocument();
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    expect(screen.queryByText("falando")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Kael está falando");
  });

  it("mutado entra no rótulo", () => {
    render(<ParticipantCard variant="portrait" characterName="Lia" playerName="Carla" color={3} muted />);
    expect(screen.getByRole("article", { name: "Lia, jogado por Carla, mutado" })).toBeInTheDocument();
  });
});

describe("ButtonLink", () => {
  it("é um link (não um botão dentro de link) com a variante", () => {
    render(
      <ButtonLink href="/criar-cenario" variant="primary" icon="plus">
        Criar Cenário
      </ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "Criar Cenário" });
    expect(link).toHaveAttribute("href", "/criar-cenario");
    expect(link).toHaveClass("primary");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("Button carregando", () => {
  it("mostra o que está acontecendo, mantém o nome e reserva a largura", () => {
    const { rerender, container } = render(
      <Button variant="primary" loadingLabel="Criando…">
        Criar Cenário
      </Button>,
    );
    // Sem carregar, a camada de "Criando…" já existe (reserva espaço), mas não aparece nem é lida.
    expect(container.querySelector(".busy")).toHaveAttribute("aria-hidden", "true");
    rerender(
      <Button variant="primary" loading loadingLabel="Criando…">
        Criar Cenário
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Criar Cenário" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveClass("loading");
    expect(screen.getByText("Criando…")).toBeInTheDocument();
    expect(container.querySelector(".busy svg")).toHaveClass("spin");
  });

  it("botão só de ícone troca o ícone pelo indicador", () => {
    const { container } = render(<IconButton icon="send" label="Enviar" loading />);
    expect(screen.getByRole("button", { name: "Enviar" })).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector("svg")).toHaveClass("spin");
  });
});
