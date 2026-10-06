import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getSiteMode } from "@/lib/mode";
import { StatusPage } from "../../inscription/_shell";

export const metadata: Metadata = {
  title: "Commande annulée",
  robots: { index: false, follow: false },
};

export default async function Page() {
  await connection();
  if ((await getSiteMode()) !== "sale") notFound();
  return (
    <StatusPage
      title="Commande interrompue."
      body={["Vous avez quitté le paiement : rien n'a été débité. Votre panier est conservé sur cet appareil."]}
      cta={{ href: "/daily-box", label: "Revenir à la Daily Box" }}
    />
  );
}
