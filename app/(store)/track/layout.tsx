import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Track your Bellaro footwear & perfume shipment in real-time. Enter your Order ID or tracking code to view live courier dispatch and delivery updates.",
  openGraph: {
    title: "Track Your Order | Bellaro",
    description:
      "Check live courier dispatch and delivery updates for your Bellaro order across Pakistan.",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
