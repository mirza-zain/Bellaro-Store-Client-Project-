import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Truck, RotateCcw, Footprints, SprayCan, MapPin } from "lucide-react";
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
    <div className="w-full flex flex-col gap-6 sm:gap-10">
      {/* 1. Mobile-First Clean Hero (Direct, Compact, Punchy) */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center bg-neutral-50/80 rounded-3xl p-5 sm:p-8 md:p-10 border border-neutral-200/70">
          {/* Left Content */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full text-[11px] font-bold tracking-wider uppercase text-neutral-800 border border-neutral-200/80 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>Bellaro PK • Step Into Style</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-neutral-900 leading-[1.08]">
              Handcrafted Luxury. <br />
              <span className="text-neutral-400 font-light text-2xl sm:text-3xl lg:text-4xl">Footwear &amp; Parfums</span>
            </h1>

            <p className="text-neutral-600 text-xs sm:text-sm md:text-base max-w-lg leading-relaxed">
              Italian-inspired horsebit loafers, casual driving moccasins, and designer cross-strap slides crafted for cloud comfort, alongside signature artisanal perfumes.
            </p>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 pt-1 w-full sm:w-auto">
              <Link
                href="/products?category=Footwear"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-black text-white font-semibold text-xs sm:text-sm rounded-xl hover:bg-neutral-800 transition shadow-xs cursor-pointer"
              >
                <Footprints className="w-4 h-4" />
                <span>Shop Footwear</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>

              <Link
                href="/products?category=Perfumes"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-white text-neutral-900 font-semibold text-xs sm:text-sm rounded-xl border border-neutral-300 hover:bg-neutral-100 transition cursor-pointer"
              >
                <SprayCan className="w-4 h-4" />
                <span>Shop Perfumes</span>
              </Link>
            </div>
          </div>

          {/* Right Hero Image (Single clean visual on desktop/tablet) */}
          <div className="lg:col-span-5 relative w-full aspect-16/9 sm:aspect-16/10 lg:aspect-4/3 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-md">
            <Image
              src="/images/product1.jpg"
              alt="Bellaro Handcrafted Footwear"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 text-white">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 block">Karachi Craftsmanship</span>
              <p className="text-xs sm:text-sm font-semibold">Pure Handcrafted Leather</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Fast Category Filter Chips (Ideal for Mobile Browsing) */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {quickCategories.map((c) => (
            <Link
              key={c.name}
              href={c.href}
              className="shrink-0 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-black hover:text-white border border-neutral-200/80 text-neutral-800 font-semibold transition-colors duration-200 flex items-center gap-2"
            >
              <span>{c.name}</span>
              <span className="text-[10px] opacity-60 font-normal">({c.count})</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Shoes & Parfums Catalog (Front & Center) */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FeaturedItems />
      </section>

      {/* 4. Compact Trust Strip */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 text-xs">
          <div className="flex items-center gap-2 text-neutral-700">
            <Truck className="w-4 h-4 text-black shrink-0" />
            <div>
              <p className="font-bold text-neutral-900 leading-tight">Cash on Delivery</p>
              <p className="text-[10px] text-neutral-500">Nationwide doorstep delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-neutral-700">
            <Sparkles className="w-4 h-4 text-black shrink-0" />
            <div>
              <p className="font-bold text-neutral-900 leading-tight">Free Shipping</p>
              <p className="text-[10px] text-neutral-500">On orders over PKR 8,000</p>
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
