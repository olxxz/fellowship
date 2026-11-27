"use client";

import { Toast as BaseToast } from "@base-ui/react/toast";
import { cx } from "../../cx";
import { Icon } from "../Icon/Icon";
import type { IconName } from "../Icon/icons";
import styles from "./Toast.module.sass";

// Avisos em popup ("perfil salvo", "não foi possível enviar"). Um gerenciador global: qualquer lugar chama toast.success(...).
const manager = BaseToast.createToastManager();

type Kind = "sucesso" | "erro" | "info";
const ICON: Record<Kind, IconName> = { sucesso: "check", erro: "close", info: "sparkle" };

function add(type: Kind, title: string, description?: string) {
  return manager.add({ title, description, type, timeout: type === "erro" ? 7000 : 4000, priority: type === "erro" ? "high" : "low" });
}

export const toast = {
  success: (title: string, description?: string) => add("sucesso", title, description),
  error: (title: string, description?: string) => add("erro", title, description),
  info: (title: string, description?: string) => add("info", title, description),
  close: (id?: string) => manager.close(id),
};

function List() {
  const { toasts } = BaseToast.useToastManager();
  return toasts.map((t) => (
    <BaseToast.Root key={t.id} toast={t} className={cx(styles.toast, styles[(t.type as Kind) ?? "info"])}>
      <span className={styles.icon} aria-hidden="true">
        <Icon name={ICON[(t.type as Kind) ?? "info"]} size={16} />
      </span>
      <BaseToast.Content className={styles.content}>
        <BaseToast.Title className={styles.title} />
        <BaseToast.Description className={styles.description} />
      </BaseToast.Content>
      <BaseToast.Close className={styles.close} aria-label="Fechar aviso">
        <Icon name="close" size={14} />
      </BaseToast.Close>
    </BaseToast.Root>
  ));
}

/** Coloque uma vez no layout raiz. */
export function Toaster() {
  return (
    <BaseToast.Provider toastManager={manager} limit={3}>
      <BaseToast.Portal>
        <BaseToast.Viewport className={styles.viewport}>
          <List />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}
