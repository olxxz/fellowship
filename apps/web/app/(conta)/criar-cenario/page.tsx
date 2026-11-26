import type { Metadata } from "next";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { CreateSpaceForm } from "./CreateSpaceForm";
import styles from "./CreateSpaceForm.module.sass";

export const metadata: Metadata = { title: "Criar Cenário" };

export default function CriarCenarioPage() {
  return (
    <>
      <ContentHeader icon="plus" title="Criar Cenário" />
      <main className={styles.page}>
        <CreateSpaceForm />
      </main>
    </>
  );
}
