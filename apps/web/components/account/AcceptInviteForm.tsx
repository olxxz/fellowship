"use client";

import { Button } from "@fellowship/ui";
import { useActionState } from "react";
import styles from "@/components/auth/Auth.module.sass";
import { acceptInviteAction, type AcceptState } from "@/lib/app/space-actions";

export function AcceptInviteForm({ code, spaceName }: { code: string; spaceName: string }) {
  const [state, action, pending] = useActionState<AcceptState, FormData>(acceptInviteAction, {});
  return (
    <form className={styles.form} action={action}>
      <input type="hidden" name="code" value={code} />
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <Button className={styles.submit} type="submit" variant="primary" loading={pending}>
        Entrar em {spaceName}
      </Button>
    </form>
  );
}
