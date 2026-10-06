import { consumeMagicLink } from "@/lib/admin-auth";
import { siteUrl } from "@/lib/email";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const ok = await consumeMagicLink(token).catch(() => false);
  return Response.redirect(`${siteUrl()}${ok ? "/admin" : "/admin/connexion?erreur=lien"}`, 303);
}
