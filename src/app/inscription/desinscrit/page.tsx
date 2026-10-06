import type { Metadata } from "next";
import { StatusPage } from "../_shell";

export const metadata: Metadata = {
  title: "Désinscription",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <StatusPage
      title="Vous êtes désinscrit."
      body={["Vous ne recevrez plus d'e-mails de Matocha. Vous pouvez vous réinscrire à tout moment."]}
    />
  );
}
