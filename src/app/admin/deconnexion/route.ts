import { logout } from "@/lib/admin-auth";

export async function POST(request: Request) {
  await logout();
  return Response.redirect(new URL("/admin/connexion", request.url), 303);
}
