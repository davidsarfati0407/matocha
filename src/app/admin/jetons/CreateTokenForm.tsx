"use client";

import { useActionState } from "react";
import { SCOPES } from "@/lib/ops/scopes";
import { createTokenAction, type TokenState } from "../actions";

export function CreateTokenForm() {
  const [state, action, pending] = useActionState<TokenState, FormData>(createTokenAction, {});
  return (
    <form action={action} className="mt-6 space-y-4 border border-current/15 p-4">
      <div>
        <label htmlFor="token-name" className="block text-sm font-semibold">
          Nom
        </label>
        <input
          id="token-name"
          name="name"
          required
          defaultValue="Instinct"
          className="mt-1 w-full max-w-sm border border-current/30 bg-transparent px-3 py-2"
        />
      </div>
      <fieldset>
        <legend className="text-sm font-semibold">Scopes</legend>
        <div className="mt-2 grid gap-1 sm:grid-cols-3">
          {SCOPES.map((scope) => (
            <label key={scope} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="scopes" value={scope} />
              <span className="font-mono">{scope}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="token-expires" className="block text-sm font-semibold">
          Expiration
        </label>
        <select id="token-expires" name="expires" defaultValue="90" className="mt-1 border border-current/30 bg-transparent px-3 py-2">
          <option value="30">30 jours</option>
          <option value="90">90 jours</option>
          <option value="365">1 an</option>
          <option value="0">Jamais</option>
        </select>
      </div>
      <button type="submit" disabled={pending} className="bg-[#1E3A2A] px-5 py-2.5 font-semibold text-[#EEEDE0] disabled:opacity-50">
        {pending ? "Création…" : "Créer le jeton"}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-[#7a2a2a]">
          {state.error}
        </p>
      )}
      {state.token && (
        <div role="status" className="bg-black/5 p-3">
          <p className="text-sm font-semibold">Copiez ce jeton maintenant : il ne sera plus affiché.</p>
          <code className="mt-2 block break-all font-mono text-sm select-all">{state.token}</code>
        </div>
      )}
    </form>
  );
}
