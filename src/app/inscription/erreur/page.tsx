import type { Metadata } from "next";
import { StatusPage } from "../_shell";

export const metadata: Metadata = {
  title: "Lien invalide",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <StatusPage
      title="Ce lien ne fonctionne plus."
      body={[
        "Le lien est invalide ou a déjà servi. Si vous vouliez confirmer votre inscription, inscrivez-vous de nouveau : un nouvel e-mail vous sera envoyé.",
      ]}
      cta={{ href: "/#inscription", label: "Être prévenu du lancement" }}
    />
  );
}
