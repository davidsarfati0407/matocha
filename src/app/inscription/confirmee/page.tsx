import type { Metadata } from "next";
import { StatusPage } from "../_shell";

export const metadata: Metadata = {
  title: "Inscription confirmée",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <StatusPage
      title="Inscription confirmée."
      body={[
        "Merci. Votre adresse est confirmée : vous serez prévenu du lancement de Matocha.",
        "Chaque e-mail contient un lien pour vous désinscrire en un clic.",
      ]}
      secondary={{ href: "/daily-box", label: "Voir la Daily Box" }}
    />
  );
}
