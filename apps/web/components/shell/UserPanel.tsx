"use client";

import { Avatar, IconButton, Menu } from "@fellowship/ui";
import Link from "next/link";
import { useDemo, type Viewer } from "@/lib/demo/store";
import { useFlag, usePref } from "@/lib/prefs";
import { applyTheme, type ThemeChoice } from "@/lib/theme";
import styles from "./UserPanel.module.sass";

/** Painel do usuário no rodapé da barra lateral: quem sou, microfone e configurações. */
export function UserPanel() {
  const { me, viewer, setViewer } = useDemo();
  const [muted, setMuted] = useFlag("mutado", false);
  const [theme, setTheme] = usePref<ThemeChoice>("tema", "system");

  return (
    <div className={styles.panel}>
      <Avatar name={me.name} color={me.color} size={36} status={me.status} />
      <div className={styles.who}>
        <span className={styles.name}>{me.name}</span>
        <span className={styles.status}>{viewer === "mestre" ? "Mestre" : "Jogando como Kael"}</span>
      </div>
      <IconButton
        icon={muted ? "micOff" : "mic"}
        label={muted ? "Ativar microfone" : "Mutar microfone"}
        aria-pressed={muted}
        variant={muted ? "danger" : "secondary"}
        onClick={() => setMuted(!muted)}
      />
      <Menu.Root>
        <Menu.Trigger render={<IconButton icon="settings" label="Configurações" />} />
        <Menu.Popup side="top" align="end">
          <Menu.Group label="Aparência">
            <Menu.RadioGroup
              value={theme}
              onValueChange={(value: ThemeChoice) => {
                setTheme(value);
                applyTheme(value);
              }}
            >
              <Menu.RadioItem value="dark">Escuro</Menu.RadioItem>
              <Menu.RadioItem value="light">Claro</Menu.RadioItem>
              <Menu.RadioItem value="system">Seguir o sistema</Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Group>
          <Menu.Separator />
          <Menu.Group label="Ver o protótipo como">
            <Menu.RadioGroup value={viewer} onValueChange={(value: Viewer) => setViewer(value)}>
              <Menu.RadioItem value="jogador">Jogador (Ana, que joga Kael)</Menu.RadioItem>
              <Menu.RadioItem value="mestre">Mestre (Rafa)</Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Group>
          <Menu.Separator />
          <Menu.LinkItem render={<Link href="/design-system" />}>Design system</Menu.LinkItem>
        </Menu.Popup>
      </Menu.Root>
    </div>
  );
}
