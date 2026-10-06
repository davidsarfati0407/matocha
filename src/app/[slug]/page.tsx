import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { site } from "@/data/site";

/**
 * Utility and legal routes referenced by the footer. Nothing here invents a
 * policy: each page states what it will contain and where to write in the
 * meantime. Replace an entry with a real route as soon as its text is drafted.
 */
const PAGES: Record<
  string,
  { label: string; title: string; accent: string; body: string[] }
> = {
  contact: {
    label: "Help",
    title: "Talk",
    accent: "to us.",
    body: [
      `Write to ${site.contact.email} for anything about orders, the waitlist or wholesale.`,
      site.contact.hours,
    ],
  },
  shipping: {
    label: "Help",
    title: "Shipping",
    accent: "& delivery.",
    body: [
      `${site.shipping.origin}. ${site.shipping.delivery}.`,
      site.shipping.note,
      "Full rates, carriers and international destinations are published here before the first box ships.",
    ],
  },
  returns: {
    label: "Help",
    title: "Returns",
    accent: "& refunds.",
    body: [
      "Our returns policy is being drafted with our fulfilment partner and will be published in full before the first order is taken.",
      `Until then, write to ${site.contact.email} and we will answer directly.`,
    ],
  },
  legal: {
    label: "Legal",
    title: "Legal",
    accent: "notice.",
    body: [
      "Company details, registration number, publishing director and hosting information will appear here once the company is registered.",
      `${site.name} — ${site.address.city}, ${site.address.country}.`,
    ],
  },
  terms: {
    label: "Legal",
    title: "Terms",
    accent: "of sale.",
    body: [
      "The general terms and conditions of sale are being prepared with counsel and will be published before checkout opens.",
      "No order can be placed on this site until they are in force.",
    ],
  },
  privacy: {
    label: "Legal",
    title: "Privacy",
    accent: "policy.",
    body: [
      "The only personal data this site currently handles is the email address you choose to give us for the waitlist.",
      "The complete GDPR privacy policy — controller, purposes, retention and your rights — is published before launch.",
    ],
  },
  cookies: {
    label: "Legal",
    title: "Cookie",
    accent: "policy.",
    body: [
      "This site sets no advertising or analytics cookies today. Your bag is kept in your browser's local storage and never leaves your device.",
      "If that changes, this page and a consent banner arrive with it.",
    ],
  },
  account: {
    label: "Account",
    title: "Your",
    accent: "account.",
    body: [
      "Accounts open with the first production run, together with order history and subscription management.",
      "Join the waitlist and we will write when they do.",
    ],
  },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) return {};

  const title = `${page.title} ${page.accent}`.replace(/\.$/, "");
  return {
    title,
    description: page.body[0],
    alternates: { canonical: `/${slug}` },
  };
}

export default async function UtilityPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();

  return (
    <>
      <PageHeader
        label={page.label}
        lines={[{ text: page.title }, { text: page.accent, italic: true }]}
      />

      <section className="pb-28 sm:pb-36">
        <Container wide>
          <Reveal className="max-w-[54ch]">
            {page.body.map((paragraph) => (
              <p key={paragraph} className="text-lead mt-5 opacity-75">
                {paragraph}
              </p>
            ))}

            <div className="mt-12 flex flex-wrap gap-3">
              <ButtonLink href="/product">Discover the box</ButtonLink>
              <ButtonLink href="/#early-access" variant="outline">
                Join the waitlist
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
