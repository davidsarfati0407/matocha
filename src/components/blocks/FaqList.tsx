import type { FaqEntry } from "@/content/faq";

/** Accessible FAQ: native <details>, works without JavaScript. */
export function FaqList({ items }: { items: FaqEntry[] }) {
  return (
    <div className="border-t border-encre/20">
      {items.map((item) => (
        <details key={item.id} id={item.id} className="group border-b border-encre/20">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
            {item.question}
            <span aria-hidden="true" className="text-2xl leading-none transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="u-prose measure pb-5">
            {item.answer.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

export function faqJsonLd(items: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer.join(" ") },
    })),
  };
}
