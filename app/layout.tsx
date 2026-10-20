import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/app/context/CartContext";

export const viewport: Viewport = {
  themeColor: "#09090b",
};

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bellaro-store.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bellaro | Handcrafted Loafers, Moccasins, Slides & Signature Perfumes",
    template: "%s | Bellaro",
  },
  description:
    "Explore Bellaro PK's handcrafted footwear and signature perfume collection. Luxury horsebit loafers, driving moccasins, designer cross-strap slides, cushioned flip-flops, and long-lasting luxury fragrances. Express delivery across Pakistan with Cash on Delivery.",
  applicationName: "Bellaro",
  alternates: {
    canonical: siteUrl,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  keywords: [
    "Bellaro",
    "Bellaro PK",
    "Bellaro shoes",
    "horsebit loafers Pakistan",
    "leather loafers Karachi",
    "driving moccasins Pakistan",
    "cross strap slides Karachi",
    "buckle sandals Pakistan",
    "cushioned flip flops Pakistan",
    "mens formal shoes Karachi",
    "Bellaro perfume",
    "luxury perfumes Pakistan",
    "artisanal fragrances",
    "cash on delivery shoes Pakistan",
  ],
  authors: [{ name: "Bellaro Official", url: "https://www.instagram.com/bellaro.pk/" }],
  creator: "Bellaro",
  publisher: "Bellaro",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Bellaro | Handcrafted Loafers, Moccasins, Slides & Signature Perfumes",
    description:
      "Explore Bellaro PK's handcrafted leather loafers, driving moccasins, designer slides, and luxury perfumes. Free express delivery over PKR 8,000 nationwide.",
    url: siteUrl,
    siteName: "Bellaro",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Bellaro - Handcrafted Luxury Loafers, Moccasins & Perfumes",
      },
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Bellaro Official Emblem",
      },
    ],
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bellaro | Handcrafted Loafers, Moccasins, Slides & Signature Perfumes",
    description:
      "Handcrafted footwear engineered for cloud comfort alongside bespoke artisanal perfumes.",
    images: ["/images/og-image.png"],
    creator: "@bellaro.pk",
    site: "@bellaro.pk",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Bellaro",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/icon-512x512.png`,
          width: 512,
          height: 512,
        },
        sameAs: [
          "https://www.instagram.com/bellaro.pk/",
          "https://wa.me/923394015589",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+92-339-4015589",
          contactType: "customer service",
          areaServed: "PK",
          availableLanguage: ["English", "Urdu"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Bellaro",
        description: "Handcrafted Loafers, Moccasins, Slides & Signature Perfumes in Pakistan",
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/products?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html
      lang="en"
      className={`h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full antialiased">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}

