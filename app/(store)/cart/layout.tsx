import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Bag",
  description:
    "Review items in your Bellaro shopping bag. Enjoy free express delivery across Pakistan on orders over PKR 8,000.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
