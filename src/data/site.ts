/**
 * Navigation, shipping and legal strings.
 * Commercial values come from `brand.ts` — never redeclare them here.
 */

import { brand } from "./brand";

export const site = {
  name: brand.brandName,
  shortName: brand.shortName,
  tagline: brand.tagline,
  description:
    "Premium Japanese matcha, perfectly portioned into individual 2g sticks. One every morning.",
  url: brand.url,
  locale: brand.locale,
  currency: brand.currency,
  address: brand.address,
  footerStatement: brand.campaignLine,
  freeShippingThreshold: brand.freeShippingThreshold,

  shipping: {
    origin: "Shipped from France",
    delivery: "Delivery in 2–4 working days",
    note: "Carrier and exact rates are confirmed at launch.",
  },

  contact: {
    email: brand.contactEmail,
    hours: "We answer within two working days.",
  },

  languages: [
    { code: "FR", label: "Français", active: true },
    { code: "EN", label: "English", active: false },
  ],
} as const;

export type NavItem = { label: string; href: string };

export const primaryNav: NavItem[] = [
  { label: "Shop", href: "/product" },
  { label: "Why sticks?", href: "/why-sticks" },
  { label: "Our matcha", href: "/our-matcha" },
  { label: "Journal", href: "/journal" },
];

export const footerColumns: { title: string; items: NavItem[] }[] = [
  {
    title: "Shop",
    items: [
      { label: "Daily Box", href: "/product" },
      { label: "Subscription", href: "/product#subscription" },
    ],
  },
  {
    title: "About",
    items: [
      { label: "Our Matcha", href: "/our-matcha" },
      { label: "Why Sticks?", href: "/why-sticks" },
      { label: "Journal", href: "/journal" },
    ],
  },
  {
    title: "Help",
    items: [
      { label: "FAQ", href: "/#faq" },
      { label: "Contact", href: "/contact" },
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Legal Notice", href: "/legal" },
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
];
