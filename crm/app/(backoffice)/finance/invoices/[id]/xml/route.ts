import { NextResponse, type NextRequest } from "next/server";
import { invoiceXml } from "@/lib/pdf/documents";

/** XML Factur-X (CII, profil BASIC WL) de la facture — le même que celui embarqué dans le PDF. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const r = await invoiceXml((await ctx.params).id);
  if (!r) return NextResponse.json({ error: "introuvable" }, { status: 404 });
  return new NextResponse(r.xml, { headers: { "content-type": "application/xml; charset=utf-8", "content-disposition": `attachment; filename="${r.number}-factur-x.xml"` } });
}
