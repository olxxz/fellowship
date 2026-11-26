import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Avatar, Button, ChatMessage, ChatNotice, Menu, ResourceBar, Sheet, Tabs } from "../src";

describe("Avatar", () => {
  it("é decorativo por padrão e anuncia nome e status quando rotulado", () => {
    const { container } = render(<Avatar name="Ana" />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    render(<Avatar name="Bruno" status="em-sessao" labelled />);
    expect(screen.getByRole("img", { name: "Bruno, em sessão" })).toBeInTheDocument();
  });
});

describe("ChatMessage", () => {
  it("mostra cabeçalho na primeira e esconde na continuação", () => {
    render(
      <>
        <ChatMessage scope="ingame" author={{ name: "Kael", color: 1 }} subtitle="Ana" time="20:14">
          Fiquem atrás de mim.
        </ChatMessage>
        <ChatMessage scope="ingame" author={{ name: "Kael", color: 1 }} time="20:14" continuation>
          A ponte não aguenta todos.
        </ChatMessage>
      </>,
    );
    expect(screen.getAllByText("Kael", { exact: true })).toHaveLength(1);
    expect(screen.getByText("Kael:")).toBeInTheDocument();
  });

  it("envio otimista avisa que está enviando, e sussurro mostra o destinatário", () => {
    render(
      <ChatMessage scope="outgame" author={{ name: "Ana" }} time="agora" pending whisperTo="Narrador">
        Posso tentar roubar a chave?
      </ChatMessage>,
    );
    expect(screen.getByText("(enviando)")).toBeInTheDocument();
    expect(screen.getByText(/sussurro para Narrador/)).toBeInTheDocument();
  });

  it("aviso de sistema", () => {
    render(<ChatNotice tone="mesa">Cena 3: A ponte de Vel</ChatNotice>);
    expect(screen.getByText("Cena 3: A ponte de Vel")).toBeInTheDocument();
  });
});

describe("ResourceBar", () => {
  it("expõe o valor como meter e ajusta com os botões", async () => {
    const onChange = vi.fn();
    render(<ResourceBar label="Vida" value={14} max={18} onChange={onChange} />);
    expect(screen.getByRole("meter", { name: "Vida" })).toHaveAttribute("aria-valuetext", "14 de 18");
    await userEvent.click(screen.getByRole("button", { name: "Diminuir Vida" }));
    expect(onChange).toHaveBeenCalledWith(13);
  });
});

function SheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Abrir ficha</Button>
      <Sheet open={open} onOpenChange={setOpen} title="Kael" description="Elfo · Ranger">
        <p>Conteúdo da ficha</p>
      </Sheet>
    </>
  );
}

describe("Sheet", () => {
  it("abre como diálogo com título e fecha pelo botão", async () => {
    render(<SheetDemo />);
    await userEvent.click(screen.getByRole("button", { name: "Abrir ficha" }));
    expect(await screen.findByRole("dialog", { name: "Kael" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});

describe("Tabs", () => {
  it("troca de painel", async () => {
    render(
      <Tabs.Root defaultValue="ingame">
        <Tabs.List>
          <Tabs.Tab value="ingame">Ingame</Tabs.Tab>
          <Tabs.Tab value="outgame">Outgame</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="ingame">Chat ingame</Tabs.Panel>
        <Tabs.Panel value="outgame">Chat outgame</Tabs.Panel>
      </Tabs.Root>,
    );
    expect(screen.getByText("Chat ingame")).toBeVisible();
    await userEvent.click(screen.getByRole("tab", { name: "Outgame" }));
    expect(screen.getByRole("tab", { name: "Outgame" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Chat outgame")).toBeVisible();
  });
});

describe("Menu", () => {
  it("escolhe uma opção de rádio", async () => {
    const onValueChange = vi.fn();
    render(
      <Menu.Root>
        <Menu.Trigger render={<Button>Tema</Button>} />
        <Menu.Popup>
          <Menu.RadioGroup value="dark" onValueChange={onValueChange}>
            <Menu.RadioItem value="dark">Escuro</Menu.RadioItem>
            <Menu.RadioItem value="light">Claro</Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Popup>
      </Menu.Root>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Tema" }));
    await userEvent.click(await screen.findByRole("menuitemradio", { name: "Claro" }));
    expect(onValueChange).toHaveBeenCalledWith("light", expect.anything());
  });
});

describe("cores livres", () => {
  it("calcula texto legível sobre a cor", async () => {
    const { readableOn, playerColorStyle } = await import("../src");
    expect(readableOn("#f2c94c")).toBe("#0e0f12");
    expect(readableOn("#1a237e")).toBe("#ffffff");
    expect(playerColorStyle("#1A237E")).toMatchObject({ "--player-color": "#1a237e", "--player-color-contrast": "#ffffff" });
    expect(playerColorStyle(3)).toMatchObject({ "--player-color": "var(--player-3)" });
  });

  it("ColorPicker escolhe sugestão, aceita hex digitado e envia no formulário", async () => {
    const { ColorPicker } = await import("../src");
    function Demo() {
      const [c, setC] = useState("#d4a24c");
      return <ColorPicker label="Cor do Cenário" name="color" value={c} onChange={setC} />;
    }
    const { container } = render(<Demo />);
    await userEvent.click(screen.getByRole("radio", { name: "Rosa" }));
    expect(container.querySelector('input[name="color"]')).toHaveValue("#ff6b9d");
    const hex = screen.getByRole("textbox", { name: "Cor em hexadecimal" });
    await userEvent.clear(hex);
    await userEvent.type(hex, "123ABC");
    expect(container.querySelector('input[name="color"]')).toHaveValue("#123abc");
  });
});

describe("placeholders gerados", () => {
  it("a mesma semente gera a mesma imagem; outra semente, outra", async () => {
    const { GeneratedBanner } = await import("../src");
    const a = render(<GeneratedBanner seed="campanha-1" color="#d4a24c" />).container.innerHTML;
    const b = render(<GeneratedBanner seed="campanha-1" color="#d4a24c" />).container.innerHTML;
    const c = render(<GeneratedBanner seed="campanha-2" color="#d4a24c" />).container.innerHTML;
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("retrato sem imagem tem nome acessível", async () => {
    const { CharacterPlaceholder } = await import("../src");
    render(<CharacterPlaceholder name="Kael" color={1} archetype="patrulheiro" />);
    expect(screen.getByRole("img", { name: "Kael (sem retrato)" })).toBeInTheDocument();
  });
});
