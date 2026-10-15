import { redirect } from "next/navigation";

// Phase 1 : la page technique sert d'accueil. En phase 2, ce sera la Map vivante.
export default function Home() {
  redirect("/tech");
}
