"use client";

import { Menu } from "@fellowship/ui";
import { usePref } from "@/lib/prefs";
import { applyTheme, type ThemeChoice } from "@/lib/theme";

/** Escolha de tema (escuro, claro, sistema), salva no navegador. Usada nos menus dos painéis. */
export function ThemeMenuGroup() {
  const [theme, setTheme] = usePref<ThemeChoice>("tema", "system");
  return (
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
  );
}
