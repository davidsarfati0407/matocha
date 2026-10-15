/** Champs de formulaire accessibles (libellé lié, message d'aide). */
import type { ComponentProps, ReactNode } from "react";

const base = "w-full rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-black/10 outline-none transition focus:ring-2 focus:ring-accent/50 disabled:bg-black/[0.03]";

export function Field({ label, hint, children, className = "" }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 text-[13px] font-medium ${className}`}>
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}
export const Input = ({ className = "", ...p }: ComponentProps<"input">) => <input className={`${base} ${className}`} {...p} />;
export const Textarea = ({ className = "", ...p }: ComponentProps<"textarea">) => <textarea className={`${base} min-h-24 ${className}`} {...p} />;
export const Select = ({ className = "", children, ...p }: ComponentProps<"select">) => (
  <select className={`${base} ${className}`} {...p}>
    {children}
  </select>
);
