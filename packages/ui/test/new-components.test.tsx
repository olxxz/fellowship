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
