import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getCommerceProvider } from "@/lib/commerce/provider";
import { getSiteMode } from "@/lib/mode";
import { StatusPage } from "../../inscription/_shell";

export const metadata: Metadata = {
  title: "Votre commande",
  robots: { index: false, follow: false },
};

/**
 * Stripe success return. The page reads the session on the server: success is
 * shown only when Stripe says the session is paid, never from the URL alone.
 */
export default async function Page({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  await connection();
  if ((await getSiteMode()) !== "sale") notFound();
  const { session_id: sessionId } = await searchParams;
  const provider = getCommerceProvider();

  let state: "paid" | "pending" | "failed" = "failed";
  if (sessionId && provider.configured) {
    try {
      const session = await provider.getCheckoutSession(sessionId);
      state =
        session.paymentStatus === "paid"
          ? "paid"
          : session.status === "expired"
            ? "failed"
            : "pending";
    } catch {
      state = "failed";
    }
  }

  if (state === "paid") {
    return (
      <StatusPage
        title="Merci, c'est commandé."
        body={[
          "Votre paiement est confirmé. Vous recevrez un e-mail récapitulatif avec le détail de la commande.",
        ]}
      />
    );
  }
  if (state === "pending") {
    return (
      <StatusPage
        title="Paiement en attente."
        body={[
          "Votre paiement n'est pas encore confirmé. Rien n'est validé tant que la banque n'a pas répondu ; un e-mail vous préviendra.",
        ]}
      />
    );
  }
  return (
    <StatusPage
      title="Le paiement n'a pas abouti."
      body={["Aucun montant n'a été validé. Vous pouvez réessayer depuis votre panier."]}
      cta={{ href: "/formats", label: "Revenir aux formats" }}
    />
  );
}
