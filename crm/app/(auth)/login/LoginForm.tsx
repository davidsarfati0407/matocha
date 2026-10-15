"use client";
import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { sendMagicLink, signIn, type LoginState } from "./actions";

type DemoAccount = { email: string; role: string; name: string };

export function LoginForm({ accounts, password, next }: { accounts: DemoAccount[]; password: string; next?: string }) {
  const t = useTranslations("login");
  const [state, login, pending] = useActionState<LoginState, FormData>(signIn, {});
  const [magic, magicAction, magicPending] = useActionState<LoginState, FormData>(sendMagicLink, {});
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const fill = (email: string) => {
    if (emailRef.current) emailRef.current.value = email;
    if (passwordRef.current) passwordRef.current.value = password;
    formRef.current?.requestSubmit();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <form ref={formRef} action={login} className="card flex flex-col gap-4 p-7">
        <input type="hidden" name="next" value={next ?? "/"} />
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("email")}
          <input ref={emailRef} name="email" type="email" required autoComplete="email" className="rounded-xl border border-black/10 bg-ground/40 px-3.5 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/25" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("password")}
          <input ref={passwordRef} name="password" type="password" required autoComplete="current-password" className="rounded-xl border border-black/10 bg-ground/40 px-3.5 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/25" />
        </label>
        {state.error && <p role="alert" className="text-sm text-accent">{t("error")}</p>}
        <button disabled={pending} className="mt-1 rounded-xl bg-brand px-4 py-2.5 font-medium text-ground transition hover:bg-brand-deep disabled:opacity-60">
          {t("submit")}
        </button>
        <button
          formAction={magicAction}
          formNoValidate
          disabled={magicPending}
          className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium transition hover:border-brand/40"
        >
          {t("magicLink")}
        </button>
        {magic.magicSent && <p className="text-sm text-ok">{t("magicSent")}</p>}
        <div className="mt-2 rounded-xl bg-ground/60 p-3 text-xs text-muted">
          <p className="font-semibold text-ink">{t("ssoTitle")}</p>
          <p>{t("ssoPending")}</p>
        </div>
      </form>

      <section aria-labelledby="demo-accounts" className="flex flex-col gap-3">
        <div>
          <h2 id="demo-accounts" className="text-sm font-semibold uppercase tracking-wider text-brand">{t("demoAccounts")}</h2>
          <p className="text-sm text-muted">{t("demoHint", { password })}</p>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {accounts.map((a) => (
            <li key={a.email}>
              <button
                type="button"
                onClick={() => fill(a.email)}
                className="card flex w-full flex-col items-start px-4 py-3 text-left transition hover:-translate-y-0.5 hover:ring-2 hover:ring-accent/40"
              >
                <span className="text-sm font-semibold">{a.role}</span>
                <span className="text-xs text-muted">{a.name}</span>
                <span className="font-mono text-[11px] text-muted">{a.email}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
