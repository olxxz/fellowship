"use client";

import { Avatar, IconButton, Menu } from "@fellowship/ui";
import Link from "next/link";
import { characters } from "@/lib/demo/data";
import { selectableUsers, useDemo } from "@/lib/demo/store";
import { useFlag, usePref } from "@/lib/prefs";
import { applyTheme, type ThemeChoice } from "@/lib/theme";
import styles from "./UserPanel.module.sass";

/** Painel do usuário no rodapé da barra lateral: quem sou, microfone e configurações. */
export function UserPanel() {
  const { me, myCharacter, viewer, meId, setMeId } = useDemo();
  const [muted, setMuted] = useFlag("mutado", false);
  const [theme, setTheme] = usePref<ThemeChoice>("tema", "system");

  return (
    <div className={styles.panel}>
      <Avatar name={me.name} color={me.color} size={36} status={me.status} />
      <div className={styles.who}>
        <span className={styles.name}>{me.name}</span>
        <span className={styles.status}>{viewer === "mestre" ? "Mestre" : `Jogando como ${myCharacter.name}`}</span>
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
          <Menu.Group label="Você é">
            <Menu.RadioGroup value={meId} onValueChange={(value: string) => setMeId(value)}>
              {selectableUsers.map((u) => {
                const character = characters.find((c) => c.ownerId === u.id);
                return (
                  <Menu.RadioItem key={u.id} value={u.id}>
                    {u.name} · {character ? character.name : "mestre"}
                  </Menu.RadioItem>
                );
              })}
            </Menu.RadioGroup>
          </Menu.Group>
          <Menu.Separator />
          <Menu.LinkItem render={<Link href="/design-system" />}>Design system</Menu.LinkItem>
        </Menu.Popup>
      </Menu.Root>
    </div>
  );
}
