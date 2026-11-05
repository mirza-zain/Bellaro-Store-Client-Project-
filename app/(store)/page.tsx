import type { Metadata } from "next";
import HomePage from "./(screens)/Home";

export const metadata: Metadata = {
  title: "Bellaro | Handcrafted Loafers, Moccasins, Slides & Signature Perfumes",
  description:
    "Explore Bellaro PK's handcrafted footwear and signature perfume collection. Luxury horsebit loafers, driving moccasins, designer cross-strap slides, cushioned flip-flops, and long-lasting luxury fragrances. Express delivery across Pakistan with Cash on Delivery.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Bellaro | Handcrafted Loafers, Moccasins, Slides & Signature Perfumes",
    description:
      "Explore Bellaro PK's handcrafted leather loafers, driving moccasins, designer slides, and luxury perfumes. Free express delivery over PKR 8,000 nationwide.",
    url: "/",
    siteName: "Bellaro",
  },
};

export default function Home() {
  return <HomePage />;
}
