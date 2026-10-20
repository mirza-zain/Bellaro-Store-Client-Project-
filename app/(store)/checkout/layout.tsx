import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Checkout",
  description:
    "Complete your Bellaro footwear and perfume order with Cash on Delivery or instant verified Bank Transfer.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
