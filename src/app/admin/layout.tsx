import type { Metadata } from "next";
import { connection } from "next/server";
import { getStore } from "@/lib/store";
import { isAdminAuthConfigured } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Back-office",
  robots: { index: false, follow: false },
};

const ENV = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_EMAILS",
  "ADMIN_SESSION_SECRET (32 caractères minimum)",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "SITE_URL",
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  /* Always per request: the configuration and the session are runtime facts. */
  await connection();
  if (!getStore() || !isAdminAuthConfigured()) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-32 pb-24 sm:px-8">
        <h1 className="text-2xl font-semibold">Stockage non configuré</h1>
        <p className="mt-4 max-w-[60ch] opacity-80">
          Le back-office a besoin d&apos;une base de données et d&apos;une configuration d&apos;accès. Renseignez ces
          variables d&apos;environnement sur Vercel, puis redéployez :
        </p>
        <ul className="mt-4 list-disc pl-5 font-mono text-sm">
          {ENV.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm opacity-70">
          Le schéma de la base est dans <code>supabase/migrations/0001_init.sql</code>.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
