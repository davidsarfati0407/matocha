"use client";

import { useActionState } from "react";
import { requestLinkAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(requestLinkAction, { sent: false });
  return (
    <form action={action} className="mt-6 space-y-3">
      <label htmlFor="admin-email" className="block text-sm font-semibold">
        Adresse e-mail
      </label>
      <input
        id="admin-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="w-full border border-current/30 bg-transparent px-3 py-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-[#1E3A2A] px-5 py-2.5 font-semibold text-[#EEEDE0] disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Recevoir un lien"}
      </button>
      {state.sent && (
        <p role="status" className="text-sm opacity-80">
          Si cette adresse est autorisée, un lien valable 15 minutes vient de lui être envoyé.
        </p>
      )}
    </form>
  );
}
