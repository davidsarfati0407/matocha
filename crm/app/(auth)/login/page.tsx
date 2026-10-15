import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/ui/Logo";
import { sectorConfig } from "@/config/sector.config";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const t = await getTranslations("login");
  const e = sectorConfig.entreprise;
  const accounts = sectorConfig.roles.map((r) => {
    const poste = sectorConfig.postes.find((p) => p.id === r.compteDemo.poste);
    return { email: r.compteDemo.email, role: r.libelle, name: poste ? poste.intitule : r.description };
  });
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col justify-center gap-8 px-4 py-10">
      <header className="flex items-center gap-3">
        <Logo size={44} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted">{t("subtitle", { company: e.nomCourt })}</p>
        </div>
        <span className="ml-auto rounded-full bg-accent/12 px-3 py-1 text-xs font-medium text-accent">{e.statutDemo}</span>
      </header>
      <LoginForm accounts={accounts} password="matocha-demo" next={next} />
    </main>
  );
}
