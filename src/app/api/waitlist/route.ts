import { NextResponse } from "next/server";

/**
 * Waitlist / newsletter capture.
 *
 * TODO(launch): connect an email provider (Klaviyo, Resend Audiences, Brevo…)
 * here. Until then the endpoint validates the address and acknowledges it
 * without storing anything — nothing is silently lost because nothing is
 * silently promised.
 */
export async function POST(request: Request) {
  let payload: { email?: unknown; source?: unknown };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 },
    );
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  if (!valid) {
    return NextResponse.json(
      { ok: false, message: "Please enter a valid email address." },
      { status: 422 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "You're on the list. We'll write before the first box ships.",
  });
}
