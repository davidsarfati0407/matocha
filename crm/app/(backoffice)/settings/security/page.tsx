import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/kit";
import { TotpManager } from "./client";

export const metadata: Metadata = { title: "Sécurité du compte" };

export default function SecurityPage() {
  return (
    <>
      <PageHeader title="Sécurité du compte" subtitle="Double authentification par application (TOTP : Google Authenticator, Microsoft Authenticator, 1Password…)" />
      <TotpManager />
    </>
  );
}
