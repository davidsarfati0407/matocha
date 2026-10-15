import { NextResponse, type NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { invoicePdf } from "@/lib/pdf/documents";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const r = await invoicePdf((await ctx.params).id);
  if (!r) return NextResponse.json({ error: (await getTranslations("finance"))("notFound") }, { status: 404 });
  return new NextResponse(new Uint8Array(r.pdf), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${r.number}.pdf"` } });
}
