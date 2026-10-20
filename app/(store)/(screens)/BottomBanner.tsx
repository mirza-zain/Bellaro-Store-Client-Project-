import { ArrowRight, Footprints, Sparkles, SprayCan } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function BottomBanner() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-10 md:my-16">
      <div className="relative w-full bg-neutral-950 text-white rounded-3xl p-8 sm:p-12 md:p-16 overflow-hidden border border-neutral-800 shadow-xl">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-neutral-800/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-neutral-800/40 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
          {/* Text Content */}
          <div className="w-full lg:w-3/5 flex flex-col items-start gap-5 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-800/80 border border-neutral-700 text-xs font-semibold uppercase tracking-wider text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>The Bellaro Signature Lifestyle</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Step Into Style. <br />
              <span className="text-neutral-400">Leave an Unforgettable Scent.</span>
            </h2>

            <p className="text-base sm:text-lg text-neutral-300 font-normal leading-relaxed max-w-xl">
              Handcrafted leather loafers, casual driving moccasins, and designer cross-strap slides engineered for effortless all-day ease, paired with Bellaro's signature bespoke parfums.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
              <Link
                href="/products?category=Footwear"
                className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3.5 bg-white text-black rounded-xl text-sm sm:text-base font-bold hover:bg-neutral-200 transition-all duration-300 shadow-sm cursor-pointer"
              >
                <Footprints className="w-4 h-4" />
                <span>Explore Footwear</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>

              <Link
                href="/products?category=Perfumes"
                className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3.5 bg-neutral-900 border border-neutral-700 text-white rounded-xl text-sm sm:text-base font-bold hover:bg-neutral-800 transition-all duration-300 cursor-pointer"
              >
                <SprayCan className="w-4 h-4" />
                <span>Discover Parfums</span>
              </Link>
            </div>
          </div>

          {/* Right Visual Highlight Card */}
          <div className="w-full lg:w-2/5 flex flex-col sm:flex-row lg:flex-col gap-4">
            <div className="flex-1 relative aspect-16/9 sm:aspect-4/3 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-lg group">
              <Image
                src="https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80"
                alt="Bellaro Handcrafted Loafers"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white">
                <span className="font-bold uppercase tracking-wider">Handcrafted Loafers</span>
                <span className="text-[10px] bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded">Horsebit & Lug Sole</span>
              </div>
            </div>

            <div className="flex-1 relative aspect-16/9 sm:aspect-4/3 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-lg group">
              <Image
                src="https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80"
                alt="Bellaro Signature Parfums"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white">
                <span className="font-bold uppercase tracking-wider">Artisanal Perfumes</span>
                <span className="text-[10px] bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded">Long-Lasting Sillage</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
