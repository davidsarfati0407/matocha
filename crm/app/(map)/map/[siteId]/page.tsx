import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MapApp from "@/components/map/MapApp";
import { loadSnapshot } from "@/lib/map/snapshot";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Map vivante" };

export default async function MapPage({ params, searchParams }: { params: Promise<{ siteId: string }>; searchParams: Promise<{ focus?: string }> }) {
  const { siteId } = await params;
  const { focus } = await searchParams;
  const supabase = await createClient();
  const snapshot = await loadSnapshot(supabase, siteId);
  if (!snapshot) notFound();
  return <MapApp initial={snapshot} focus={focus} />;
}
