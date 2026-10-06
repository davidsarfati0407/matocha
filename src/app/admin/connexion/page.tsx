import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  if (await getAdminSession()) redirect("/admin");
  const { erreur } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-5 pt-32 pb-24">
      <h1 className="text-2xl font-semibold">Back-office Matocha</h1>
      <p className="mt-3 opacity-80">Recevez un lien de connexion par e-mail. Accès réservé aux adresses autorisées.</p>
      {erreur && (
        <p role="alert" className="mt-4 border-l-2 border-[#7a2a2a] pl-3 text-sm">
          Ce lien est invalide ou a expiré. Demandez-en un nouveau.
        </p>
      )}
      <LoginForm />
    </div>
  );
}
