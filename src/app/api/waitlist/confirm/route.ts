import { siteUrl } from "@/lib/email";
import { confirmLead } from "@/lib/waitlist/service";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  let ok = false;
  try {
    ok = await confirmLead(token);
  } catch (error) {
    console.error("[waitlist] confirm failed", error);
  }
  return Response.redirect(
    `${siteUrl()}/inscription/${ok ? "confirmee" : "erreur"}`,
    303,
  );
}
