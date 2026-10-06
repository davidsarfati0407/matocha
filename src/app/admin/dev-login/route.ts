import { devLogin } from "@/lib/admin-auth";

/**
 * Development/test only (Playwright): opens an admin session without e-mail.
 * 404 in production, or unless ADMIN_DEV_LOGIN=true.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production" || process.env.ADMIN_DEV_LOGIN !== "true") {
    return new Response("Not found", { status: 404 });
  }
  const ok = await devLogin();
  if (!ok) return new Response("Not found", { status: 404 });
  return Response.redirect(new URL("/admin", request.url), 303);
}
