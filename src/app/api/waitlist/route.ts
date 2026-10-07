import { subscribe } from "@/lib/waitlist/service";

/**
 * Waitlist sign-up with double opt-in.
 *
 * 200 {ok:true,status:"pending"} — always the same answer for a new, pending
 * or already-confirmed address, so the endpoint does not reveal who is listed.
 * 200 {ok:true,status:"received"} — Formspree fallback (single opt-in).
 * A filled honeypot gets the same 200 and nothing is kept.
 * 503 not_configured when storage or e-mail is missing: never a fake "you're in".
 */
export async function POST(request: Request) {
  const result = await subscribe(request);
  if (result.ok) {
    return Response.json(
      { ok: true, status: result.status, message: result.message },
      { status: 200 },
    );
  }
  return Response.json(
    { ok: false, code: result.code, message: result.message },
    { status: result.httpStatus },
  );
}
