import Image from "next/image";
import Link from "next/link";
import { Sparkles, Truck, RotateCcw, MapPin } from "lucide-react";
import FeaturedItems from "./FeaturedItems";

export default function HomePage() {
  const quickCategories = [
    { name: "All Footwear", href: "/products?category=Footwear", count: "Catalog" },
    { name: "Loafers", href: "/products?category=Footwear&subCategory=Loafers", count: "EUR 39-45" },
    { name: "Moccasins", href: "/products?category=Footwear&subCategory=Moccasins", count: "Suede & Leather" },
    { name: "Slides & Sandals", href: "/products?category=Footwear&subCategory=Slides", count: "Cloud Cushion" },
    { name: "Perfumes", href: "/products?category=Perfumes", count: "Extrait / EDP" },
  ];

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-8">
      {/* 1. Sleek Compact Campaign Hero (Ultra-Clean on Mobile) */}
      <section className="relative w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-1 sm:pt-4">
        <div className="relative w-full h-[240px] sm:h-[320px] md:h-[380px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-neutral-200/60">
          <Image
            src="/images/product1.jpg"
            alt="Bellaro Handcrafted Footwear"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Subtle luxury gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

          {/* Minimal, direct overlay content */}
          <div className="absolute inset-x-4 bottom-4 sm:inset-x-8 sm:bottom-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 text-white">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-neutral-300">
                Handcrafted in Karachi
              </span>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold uppercase tracking-tight leading-tight mt-0.5">
                Footwear &amp; Signature Parfums
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/products?category=Footwear"
                className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200 transition shadow-xs cursor-pointer"
              >
                Shop Footwear
              </Link>
              <Link
                href="/products?category=Perfumes"
                className="px-4 py-2 bg-black/40 backdrop-blur-md text-white border border-white/30 text-xs font-bold rounded-lg hover:bg-white/20 transition cursor-pointer"
              >
                Shop Perfumes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Fast Category Filter Chips (One-Tap Navigation) */}
      <section className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {quickCategories.map((c) => (
            <Link
              key={c.name}
              href={c.href}
              className="shrink-0 px-3.5 py-1.5 sm:py-2 rounded-xl bg-neutral-100 hover:bg-black hover:text-white border border-neutral-200/80 text-neutral-800 font-semibold transition-colors duration-200 flex items-center gap-1.5"
            >
              <span>{c.name}</span>
              <span className="text-[10px] opacity-60 font-normal">({c.count})</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Shoes & Parfums Catalog (Immediately Visible on Mobile) */}
      <section className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <FeaturedItems />
      </section>

      {/* 4. Compact Trust Strip */}
      <section className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 bg-neutral-50 rounded-2xl p-3.5 sm:p-4 border border-neutral-200/80 text-xs">
          <div className="flex items-center gap-2 text-neutral-700">
            <Truck className="w-4 h-4 text-black shrink-0" />
            <div>
              <p className="font-bold text-neutral-900 leading-tight">Cash on Delivery</p>
              <p className="text-[10px] text-neutral-500">Nationwide delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-neutral-700">
            <Sparkles className="w-4 h-4 text-black shrink-0" />
            <div>
              <p className="font-bold text-neutral-900 leading-tight">Free Shipping</p>
              <p className="text-[10px] text-neutral-500">Over PKR 8,000</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-neutral-700">
            <RotateCcw className="w-4 h-4 text-black shrink-0" />
            <div>
              <p className="font-bold text-neutral-900 leading-tight">Easy Exchanges</p>
              <p className="text-[10px] text-neutral-500">Hassle-free size swaps</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-neutral-700">
            <MapPin className="w-4 h-4 text-black shrink-0" />
            <div>
              <p className="font-bold text-neutral-900 leading-tight">Karachi Store</p>
              <p className="text-[10px] text-neutral-500">Zamzama DHA Phase 5</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
