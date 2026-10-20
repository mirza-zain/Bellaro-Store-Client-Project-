import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us & Support",
  description:
    "Get in touch with the Bellaro customer service team. Reach out via WhatsApp or direct helpline for shoe sizing advice, perfume consultations, and express delivery assistance across Pakistan.",
  openGraph: {
    title: "Contact Us & Support | Bellaro",
    description:
      "Get in touch with the Bellaro customer support team for shoe orders, sizing inquiries, and delivery assistance across Pakistan.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
