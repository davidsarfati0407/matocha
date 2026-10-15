import { redirect } from "next/navigation";
import { sectorConfig } from "@/config/sector.config";

// Accueil après connexion : la Map vivante du premier site.
export default function Home() {
  redirect(`/map/${sectorConfig.lieux[0].id}`);
}
