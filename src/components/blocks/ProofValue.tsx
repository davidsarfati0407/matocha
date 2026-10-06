import { fr } from "@/content/i18n/fr";

/** Renders a Proof-derived value: the value when confirmed, otherwise the pending label and the public hypothesis. */
export function ProofValue({
  value,
}: {
  value: { text: string; confirmed: boolean; target?: string };
}) {
  if (value.confirmed) return <>{value.text}</>;
  return (
    <>
      <span className="pending">{value.text}</span>
      {value.target && (
        <span className="mt-0.5 block text-sm">
          {fr.inside.target} : {value.target}
        </span>
      )}
    </>
  );
}
