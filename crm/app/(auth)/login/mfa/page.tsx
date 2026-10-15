import type { Metadata } from "next";
import { MfaChallenge } from "./client";

export const metadata: Metadata = { title: "Double authentification" };

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = (await searchParams).next;
  return (
    <main className="grid min-h-dvh place-items-center bg-ground p-4">
      <MfaChallenge next={next?.startsWith("/") ? next : "/dashboard"} />
    </main>
  );
}
