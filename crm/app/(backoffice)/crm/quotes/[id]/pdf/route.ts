import { NextResponse, type NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { quotePdf } from "@/lib/pdf/documents";

/** PDF du devis, généré à la volée avec les droits (RLS) de l'utilisateur. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const r = await quotePdf((await ctx.params).id);
  if (!r) return NextResponse.json({ error: (await getTranslations("crm"))("notFound") }, { status: 404 });
  return new NextResponse(new Uint8Array(r.pdf), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${r.number}.pdf"` } });
}
