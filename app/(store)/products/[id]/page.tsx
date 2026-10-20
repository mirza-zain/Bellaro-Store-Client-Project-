import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Check, ShieldCheck, Truck, RotateCcw, Star } from "lucide-react";
import { getProductById } from "@/app/lib/actions/store";
import { getProductReviews } from "@/app/lib/actions/reviews";
import ProductPurchaseActions from "./(components)/ProductPurchaseActions";
import ProductReviewsSection from "./(components)/ProductReviewsSection";

interface Props {
  params: Promise<{ id: string }>;
}

export const instant = false;

const curatedProductsMap: Record<number, any> = {
  1: {
    id: 1,
    name: "Bellaro Monarch Horsebit Leather Loafers",
    description: "Signature handcrafted genuine leather horsebit loafers featuring polished gold metallic horsebit hardware, full leather lining, cushioned leather insole, and durable non-slip lug outsoles. Tailored for both formal gatherings and smart-casual styling.",
    category: "Footwear",
    subCategory: "Loafers",
    price: "5850",
    stock: "20",
    image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80",
    variants: [
      { label: "EU 40 / UK 6", price: 5850, stock: 4 },
      { label: "EU 41 / UK 7", price: 5850, stock: 6 },
      { label: "EU 42 / UK 8", price: 5850, stock: 6 },
      { label: "EU 43 / UK 9", price: 5850, stock: 4 },
    ],
  },
  2: {
    id: 2,
    name: "Bellaro Lug-Sole Patent Penny Loafers",
    description: "Rich burgundy oxblood and deep black patent leather loafers with a commanding chunky lugged outsole, penny strap saddle, and refined stitch detailing for distinguished presence.",
    category: "Footwear",
    subCategory: "Loafers",
    price: "6200",
    stock: "15",
    image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80",
    variants: [
      { label: "EU 40 / UK 6", price: 6200, stock: 3 },
      { label: "EU 41 / UK 7", price: 6200, stock: 5 },
      { label: "EU 42 / UK 8", price: 6200, stock: 5 },
      { label: "EU 43 / UK 9", price: 6200, stock: 2 },
    ],
  },
  3: {
    id: 3,
    name: "Bellaro Modena Tan Suede Driving Moccasins",
    description: "Handcrafted Italian-style slip-on driving moccasins in rich tan suede leather. Built with cushioned memory footbeds and studded rubber soles for effortless walking and driving comfort.",
    category: "Footwear",
    subCategory: "Moccasins",
    price: "4650",
    stock: "25",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
    variants: [
      { label: "EU 40 / UK 6", price: 4650, stock: 5 },
      { label: "EU 41 / UK 7", price: 4650, stock: 8 },
      { label: "EU 42 / UK 8", price: 4650, stock: 8 },
      { label: "EU 43 / UK 9", price: 4650, stock: 4 },
    ],
  },
  4: {
    id: 4,
    name: "Bellaro Royale Cross-Strap Leather Slides",
    description: "Designer crisscross slide sandals crafted with structured patterned straps, ergonomic contoured footbeds, and all-day casual ease for summer comfort.",
    category: "Footwear",
    subCategory: "Slides",
    price: "3250",
    stock: "30",
    image: "https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format&fit=crop&w=800&q=80",
    variants: [
      { label: "EU 40 / UK 6", price: 3250, stock: 8 },
      { label: "EU 41 / UK 7", price: 3250, stock: 10 },
      { label: "EU 42 / UK 8", price: 3250, stock: 8 },
      { label: "EU 43 / UK 9", price: 3250, stock: 4 },
    ],
  },
  5: {
    id: 5,
    name: "Bellaro Dual-Buckle Comfort Sandals",
    description: "Modern dual-strap buckle slides featuring adjustable matte buckles and shock-absorbing contoured insoles in charcoal grey and tan.",
    category: "Footwear",
    subCategory: "Sandals",
    price: "3450",
    stock: "20",
    image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80",
    variants: [
      { label: "EU 40 / UK 6", price: 3450, stock: 5 },
      { label: "EU 41 / UK 7", price: 3450, stock: 8 },
      { label: "EU 42 / UK 8", price: 3450, stock: 7 },
    ],
  },
  6: {
    id: 6,
    name: "Bellaro Cloudfoam Ergonomic Flip-Flops",
    description: "Ultra-soft recovery flip-flops with cushioned thong straps, textured non-slip footbeds, and wave-tread grip for lightweight daily ease.",
    category: "Footwear",
    subCategory: "Flip-Flops",
    price: "2450",
    stock: "35",
    image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80",
    variants: [
      { label: "EU 40 / UK 6", price: 2450, stock: 10 },
      { label: "EU 41 / UK 7", price: 2450, stock: 15 },
      { label: "EU 42 / UK 8", price: 2450, stock: 10 },
    ],
  },
  7: {
    id: 7,
    name: "Bellaro Velvet Amber Eau de Parfum (100ml)",
    description: "A commanding signature fragrance blending smoky amber, warm bergamot, creamy vanilla, and velvety cedarwood notes.",
    category: "Perfumes",
    subCategory: "EauDeParfum",
    price: "6800",
    stock: "35",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    variants: [
      { label: "50ml Travel Bottle", price: 4200, stock: 15 },
      { label: "100ml Full Presentation", price: 6800, stock: 20 },
    ],
  },
  8: {
    id: 8,
    name: "Bellaro Noir Oud Extrait De Parfum (100ml)",
    description: "An opulent nocturnal fragrance featuring Cambodian oud, dark rose, leather accords, and rich oriental musk.",
    category: "Perfumes",
    subCategory: "Artisanal",
    price: "7200",
    stock: "28",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
    variants: [
      { label: "50ml Travel Bottle", price: 4500, stock: 12 },
      { label: "100ml Full Presentation", price: 7200, stock: 16 },
    ],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const productId = parseInt(resolvedParams.id, 10);
  if (isNaN(productId)) return { title: "Product Not Found" };

  const dbProduct = await getProductById(productId);
  const product = dbProduct || curatedProductsMap[productId];
  if (!product) return { title: "Product Not Found" };

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bellaro-store.vercel.app";
  const productUrl = `${siteUrl}/products/${product.id}`;

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: `${product.name} | Bellaro`,
      description: product.description.slice(0, 160),
      url: productUrl,
      images: product.image ? [{ url: product.image, alt: product.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Bellaro`,
      description: product.description.slice(0, 160),
      images: product.image ? [product.image] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const productId = parseInt(resolvedParams.id, 10);

  if (isNaN(productId)) {
    notFound();
  }

  const dbProduct = await getProductById(productId);
  const product = dbProduct || curatedProductsMap[productId];

  if (!product) {
    notFound();
  }

  const reviewsSummary = await getProductReviews(productId);

  const inStock = Number(product.stock) > 0;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bellaro-store.vercel.app";

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image || `${siteUrl}/images/img1.jpg`,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: "Bellaro",
    },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.id}`,
      priceCurrency: "PKR",
      price: product.price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Bellaro",
      },
    },
    ...(reviewsSummary.totalReviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewsSummary.averageRating.toFixed(1),
            reviewCount: reviewsSummary.totalReviews,
          },
        }
      : {}),
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-5 md:px-12 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {/* Back Link */}
      <div className="mb-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">
        {/* Product Image Gallery */}
        <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xs">
          <Image
            src={product.image || "/images/img1.jpg"}
            alt={product.name}
            fill
            className="object-cover object-top"
            priority
          />
        </div>

        {/* Product Info & Purchase Form */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-widest">
              <span>{product.category}</span>
              <span>•</span>
              <span>{product.subCategory}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mt-2">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 mt-2.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(reviewsSummary.averageRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-neutral-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-neutral-900">
                {reviewsSummary.totalReviews > 0 ? reviewsSummary.averageRating.toFixed(1) : "5.0"}
              </span>
              <span className="text-xs text-neutral-400">
                ({reviewsSummary.totalReviews}{" "}
                {reviewsSummary.totalReviews === 1 ? "verified review" : "verified reviews"})
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-3">
              PKR {Number(product.price).toLocaleString()}
            </p>
          </div>

          {/* Stock Status Indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                inStock
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  inStock ? "bg-emerald-600" : "bg-rose-600"
                }`}
              />
              {inStock ? "In Stock & Ready to Ship" : "Out of Stock"}
            </span>
          </div>

          {/* Description */}
          <div className="border-t border-b border-neutral-200 py-4">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">About the product</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Purchase Actions (Variant, Quantity, Add to Bag, Buy Now) */}
          <ProductPurchaseActions
            productId={product.id}
            name={product.name}
            category={product.category}
            price={Number(product.price)}
            stock={Number(product.stock)}
            image={product.image || "/images/img1.jpg"}
            variants={product.variants || []}
          />

          {/* Trust Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-neutral-100 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-black shrink-0" />
              <span>Free delivery over PKR 8,000</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-black shrink-0" />
              <span>30-day easy returns</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-black shrink-0" />
              <span>100% genuine product</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Customer Reviews Section */}
      <ProductReviewsSection
        productId={product.id}
        productName={product.name}
        summary={reviewsSummary}
      />
    </div>
  );
}

