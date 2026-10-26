import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getStoreProducts } from "@/app/lib/actions/store";
import ShopFilterView from "./(components)/ShopFilterView";

interface Props {
  searchParams: Promise<{ category?: string; subCategory?: string; search?: string }>;
}

export const instant = false;

export const metadata: Metadata = {
  title: "Explore Footwear & Fragrance Catalog | Bellaro",
  description:
    "Filter and browse through our complete collection of handcrafted leather loafers, driving moccasins, designer slides, buckle sandals, and luxury signature perfumes at Bellaro PK.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Explore Footwear & Fragrance Catalog | Bellaro PK",
    description:
      "Filter and browse through our complete collection of handcrafted leather loafers, driving moccasins, designer slides, buckle sandals, and luxury signature perfumes at Bellaro PK.",
  },
};

const curatedBellaroCatalog = [
  {
    id: 1,
    name: "Bellaro Monarch Horsebit Leather Loafers",
    description: "Signature handcrafted genuine leather horsebit loafers featuring polished gold metallic horsebit hardware, full leather lining, and durable lug soles.",
    category: "Footwear",
    subCategory: "Loafers",
    price: "5850",
    stock: "20",
    image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80",
    colors: ["Jet Black", "Coffee Brown"],
    variants: [],
  },
  {
    id: 2,
    name: "Bellaro Lug-Sole Patent Penny Loafers",
    description: "Rich burgundy oxblood and deep black patent leather loafers with a commanding chunky lugged outsole and refined stitch detailing.",
    category: "Footwear",
    subCategory: "Loafers",
    price: "6200",
    stock: "15",
    image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80",
    colors: ["Burgundy Oxblood", "Deep Black"],
    variants: [],
  },
  {
    id: 3,
    name: "Bellaro Modena Tan Suede Driving Moccasins",
    description: "Handcrafted Italian-style slip-on driving moccasins in rich tan suede leather. Built with cushioned memory footbeds for daily walking comfort.",
    category: "Footwear",
    subCategory: "Moccasins",
    price: "4650",
    stock: "25",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
    colors: ["Classic Tan", "Chocolate Brown", "Navy Blue"],
    variants: [],
  },
  {
    id: 4,
    name: "Bellaro Royale Cross-Strap Leather Slides",
    description: "Designer crisscross slide sandals crafted with structured patterned straps, ergonomic contoured footbeds, and all-day casual ease.",
    category: "Footwear",
    subCategory: "Slides",
    price: "3250",
    stock: "30",
    image: "https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format&fit=crop&w=800&q=80",
    colors: ["Matte Black", "Cognac Brown"],
    variants: [],
  },
  {
    id: 5,
    name: "Bellaro Dual-Buckle Comfort Sandals",
    description: "Modern dual-strap buckle slides featuring adjustable matte buckles and shock-absorbing contoured insoles in charcoal grey and tan.",
    category: "Footwear",
    subCategory: "Sandals",
    price: "3450",
    stock: "20",
    image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80",
    colors: ["Charcoal Grey", "Tan Brown"],
    variants: [],
  },
  {
    id: 6,
    name: "Bellaro Cloudfoam Ergonomic Flip-Flops",
    description: "Ultra-soft recovery flip-flops with cushioned thong straps, textured non-slip footbeds, and wave-tread grip for lightweight daily ease.",
    category: "Footwear",
    subCategory: "Flip-Flops",
    price: "2450",
    stock: "35",
    image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80",
    colors: ["Jet Black", "Navy", "Olive"],
    variants: [],
  },
  {
    id: 7,
    name: "Bellaro Velvet Amber Eau de Parfum (100ml)",
    description: "A commanding signature fragrance blending smoky amber, warm bergamot, creamy vanilla, and velvety cedarwood notes.",
    category: "Perfumes",
    subCategory: "EauDeParfum",
    price: "6800",
    stock: "35",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    colors: [],
    variants: [],
  },
  {
    id: 8,
    name: "Bellaro Noir Oud Extrait De Parfum (100ml)",
    description: "An opulent nocturnal fragrance featuring Cambodian oud, dark rose, leather accords, and rich oriental musk.",
    category: "Perfumes",
    subCategory: "Artisanal",
    price: "7200",
    stock: "28",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
    colors: [],
    variants: [],
  },
];

export default async function ProductsCatalogPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const activeCategory = resolvedParams?.category || "all";
  const activeSubCategory = resolvedParams?.subCategory || "all";
  const activeSearch = resolvedParams?.search || "";

  const dbProducts = await getStoreProducts();
  const allProducts = dbProducts && dbProducts.length > 0 ? dbProducts : curatedBellaroCatalog;

  return (
    <div className="w-full max-w-7xl mx-auto px-5 md:px-12 py-10">
      {/* Breadcrumb / Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header */}
      <div className="pb-8 border-b border-neutral-200">
        <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-neutral-900">
          Explore Footwear & Parfums
        </h1>
        <p className="text-neutral-500 text-sm md:text-base mt-1">
          Handcrafted loafers, driving moccasins, designer slides, buckle sandals, and artisanal fragrances designed for supreme comfort and distinction.
        </p>
      </div>

      {/* Interactive Filter & Product View */}
      <div className="mt-8">
        <ShopFilterView
          initialProducts={allProducts}
          initialCategory={activeCategory}
          initialSubCategory={activeSubCategory}
          initialSearch={activeSearch}
        />
      </div>
    </div>
  );
}
