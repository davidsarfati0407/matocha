import { siteUrl } from "@/lib/email";
import { unsubscribeLead } from "@/lib/waitlist/service";

async function handle(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  let ok = false;
  try {
    ok = await unsubscribeLead(token);
  } catch (error) {
    console.error("[waitlist] unsubscribe failed", error);
  }
  return { ok };
}

/** Link in the e-mail footer. */
export async function GET(request: Request) {
  const { ok } = await handle(request);
  return Response.redirect(
    `${siteUrl()}/inscription/${ok ? "desinscrit" : "erreur"}`,
    303,
  );
}

/** RFC 8058 one-click (List-Unsubscribe-Post): mail clients POST here. */
export async function POST(request: Request) {
  const { ok } = await handle(request);
  return Response.json({ ok }, { status: ok ? 200 : 404 });
}
