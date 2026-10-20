import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles, ShieldCheck, Truck, RotateCcw, Footprints, SprayCan } from "lucide-react";
import ScreenCategory from "./ScreenCategory";
import SupportBanner from "./SupportBanner";
import FeaturedItems from "./FeaturedItems";
import BottomBanner from "./BottomBanner";

export default function HomePage() {
  const editorialCollections = [
    {
      title: "Luxury Leather Loafers",
      subtitle: "Horsebit, Lug-Sole & Penny Loafers",
      href: "/products?category=Footwear&subCategory=Loafers",
      image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80",
      tag: "Signature Loafers",
    },
    {
      title: "Casual Driving Moccasins",
      subtitle: "Suede & Leather Driving Slip-Ons",
      href: "/products?category=Footwear&subCategory=Moccasins",
      image: "https://images.unsplash.com/photo-1576792741377-eb0f4f6d1a47?auto=format&fit=crop&w=800&q=80",
      tag: "Driving Shoes",
    },
    {
      title: "Crisscross Slides & Sandals",
      subtitle: "Designer Cross-Strap & Buckle Slides",
      href: "/products?category=Footwear&subCategory=Slides",
      image: "https://images.unsplash.com/photo-1585120824848-8a5cd41493d2?auto=format&fit=crop&w=800&q=80",
      tag: "Comfort Slides",
    },
    {
      title: "Bespoke Signature Parfums",
      subtitle: "Long-Lasting Haute Fragrances",
      href: "/products?category=Perfumes",
      image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
      tag: "Haute Scent",
    },
  ];

  return (
    <>
      {/* High-Fashion Editorial Hero Section: Split Text & 2-Picture Showcase */}
      <section className="relative w-full max-w-7xl mx-auto px-5 md:px-12 pt-6 pb-12 sm:pt-10 sm:pb-16 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-12 items-center">
          {/* Left Column: Text Content */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-neutral-100 rounded-full text-xs font-semibold tracking-wider uppercase text-neutral-800 border border-neutral-200">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>Bellaro PK • Step Into Style</span>
            </div>

            {/* Main Hero Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-neutral-900 leading-[1.02]">
              Handcrafted Luxury. <br />
              <span className="text-neutral-400 font-normal">Step Into </span>
              Style
            </h1>

            {/* Hero Subtitle */}
            <p className="text-neutral-600 text-sm sm:text-base md:text-lg max-w-xl font-normal leading-relaxed">
              From Italian-inspired horsebit loafers and hand-stitched driving moccasins to designer crisscross slides and signature bespoke perfumes — crafted with precision in Karachi.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
              <Link
                href="/products?category=Footwear"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white font-semibold text-sm sm:text-base rounded-2xl hover:bg-neutral-800 transition shadow-sm cursor-pointer"
              >
                <Footprints className="w-4 h-4" />
                <span>Explore Footwear</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Link>

              <Link
                href="/products?category=Perfumes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-neutral-100 text-neutral-900 font-semibold text-sm sm:text-base rounded-2xl hover:bg-neutral-200 transition cursor-pointer"
              >
                <SprayCan className="w-4 h-4" />
                <span>Discover Perfumes</span>
              </Link>
            </div>

            {/* Trust Guarantees */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-xs text-neutral-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-black shrink-0" />
                <span>Nationwide Cash on Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-black shrink-0" />
                <span>100% Genuine Handcrafted Leather</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-black shrink-0" />
                <span>Hassle-Free Size Exchanges</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic 2-Picture Luxury Showcase */}
          <div className="lg:col-span-5 relative w-full pt-4 pb-6 lg:py-0">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Picture 1: Primary Handcrafted Footwear Showcase */}
              <Link
                href="/products?category=Footwear&subCategory=Loafers"
                className="group relative block aspect-4/5 w-full sm:w-[90%] rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xl"
              >
                <Image
                  src="https://images.unsplash.com/photo-1616406432452-07bc5938759d?auto=format&fit=crop&w=1200&q=85"
                  alt="Bellaro Handcrafted Horsebit Loafers"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Top Badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/95 backdrop-blur-xs text-black text-xs font-bold uppercase rounded-lg shadow-sm">
                    Signature Loafers
                  </span>
                </div>

                {/* Bottom Details */}
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between text-white">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight leading-tight group-hover:underline">
                      Monarch Horsebit Loafers
                    </h2>
                    <p className="text-xs text-neutral-300 mt-1">
                      Pure Handcrafted Leather • Ergonomic Lug Sole
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition shrink-0 ml-3">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>

              {/* Picture 2: Secondary Overlapping Showcase (Signature Perfume) */}
              <Link
                href="/products?category=Perfumes"
                className="group absolute -bottom-4 -right-2 sm:-bottom-6 sm:-right-2 w-[62%] sm:w-[58%] aspect-4/3 rounded-2xl overflow-hidden bg-neutral-900 border-2 border-white shadow-2xl transition-transform hover:-translate-y-1 duration-300 block"
              >
                <Image
                  src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=85"
                  alt="Bellaro Bespoke Signature Parfums"
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 bg-black/70 backdrop-blur-xs border border-white/20 text-white text-[10px] font-bold uppercase rounded-md">
                    Bespoke Parfums
                  </span>
                </div>

                <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between text-white">
                  <div>
                    <p className="text-xs font-bold leading-tight group-hover:underline">
                      Velvet Amber EDP
                    </p>
                    <p className="text-[10px] text-neutral-300">10+ Hr Longevity</p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-xs text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition shrink-0">
                    <ArrowUpRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Editorial 4-Card Showcase Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-16 sm:mt-20">
          {editorialCollections.map((col, idx) => (
            <Link
              key={idx}
              href={col.href}
              className="group relative aspect-3/4 rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xs block"
            >
              <Image
                src={col.image}
                alt={col.title}
                fill
                priority={idx < 2}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              {/* Tag Pill */}
              <div className="absolute top-4 left-4">
                <span className="px-2.5 py-1 bg-white/90 backdrop-blur-xs text-black text-[11px] font-bold uppercase rounded-lg shadow-xs">
                  {col.tag}
                </span>
              </div>

              {/* Card Footer Content */}
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between">
                <div>
                  <h3 className="text-white text-lg font-bold leading-tight group-hover:underline">
                    {col.title}
                  </h3>
                  <p className="text-neutral-300 text-xs mt-0.5">{col.subtitle}</p>
                </div>

                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Sleek Marquee Brand Ticker */}
      <div className="w-full bg-black text-white py-3.5 overflow-hidden border-y border-neutral-800">
        <div className="flex w-max animate-scroll-left gap-8 text-xs sm:text-sm font-bold uppercase tracking-widest">
          <div className="flex items-center gap-8 shrink-0">
            <span>Step Into Style</span>
            <span>•</span>
            <span>Handcrafted In Karachi</span>
            <span>•</span>
            <span>Horsebit Leather Loafers</span>
            <span>•</span>
            <span>Driving Moccasins</span>
            <span>•</span>
            <span>Crisscross Slides</span>
            <span>•</span>
            <span>Dual-Buckle Sandals</span>
            <span>•</span>
            <span>Cushioned Flip-Flops</span>
            <span>•</span>
            <span>Signature Bespoke Perfumes</span>
            <span>•</span>
            <span>Cash on Delivery Nationwide</span>
            <span>•</span>
            <span>Follow @bellaro.pk</span>
            <span>•</span>
          </div>
          <div className="flex items-center gap-8 shrink-0">
            <span>Step Into Style</span>
            <span>•</span>
            <span>Handcrafted In Karachi</span>
            <span>•</span>
            <span>Horsebit Leather Loafers</span>
            <span>•</span>
            <span>Driving Moccasins</span>
            <span>•</span>
            <span>Crisscross Slides</span>
            <span>•</span>
            <span>Dual-Buckle Sandals</span>
            <span>•</span>
            <span>Cushioned Flip-Flops</span>
            <span>•</span>
            <span>Signature Bespoke Perfumes</span>
            <span>•</span>
            <span>Cash on Delivery Nationwide</span>
            <span>•</span>
            <span>Follow @bellaro.pk</span>
            <span>•</span>
          </div>
        </div>
      </div>

      <ScreenCategory />
      <FeaturedItems />
      <SupportBanner />
      <BottomBanner />
    </>
  );
}
