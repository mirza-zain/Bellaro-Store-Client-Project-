import { Footprints, Sparkles, SprayCan, Crown } from "lucide-react";
import Link from "next/link";

export default function ScreenCategory() {
  const items = [
    {
      id: 1,
      category: "Loafers & Formals",
      subtitle: "Horsebit, lug-sole & penny loafers",
      href: "/products?category=Footwear&subCategory=Loafers",
      icon: <Crown className="w-7 h-7" />,
      badge: "Signature",
    },
    {
      id: 2,
      category: "Casual Moccasins",
      subtitle: "Suede & leather driving slip-ons",
      href: "/products?category=Footwear&subCategory=Moccasins",
      icon: <Footprints className="w-7 h-7" />,
      badge: "Comfort",
    },
    {
      id: 3,
      category: "Slides & Sandals",
      subtitle: "Crisscross slides & buckle sandals",
      href: "/products?category=Footwear&subCategory=Slides",
      icon: <Sparkles className="w-7 h-7" />,
      badge: "Summer",
    },
    {
      id: 4,
      category: "Signature Perfumes",
      subtitle: "Artisanal long-lasting scents",
      href: "/products?category=Perfumes",
      icon: <SprayCan className="w-7 h-7" />,
      badge: "Exclusive",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-5 md:px-12 py-16 flex flex-col items-center justify-center gap-8">
      <div className="text-center max-w-2xl space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          The Bellaro Collection
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-neutral-900">
          Explore Categories
        </h2>
        <p className="text-sm sm:text-base text-neutral-500">
          Handcrafted in Karachi with genuine leathers, cloud-soft insoles, and bespoke perfume formulations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group relative flex flex-col justify-between p-6 bg-neutral-50 rounded-2xl border border-neutral-200/80 hover:bg-neutral-950 hover:border-neutral-950 transition-all duration-300 ease-in-out shadow-xs hover:shadow-lg"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:border-neutral-800 group-hover:text-white transition-colors duration-300">
                {item.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800 group-hover:bg-neutral-800 group-hover:text-neutral-200 transition-colors">
                {item.badge}
              </span>
            </div>

            <div className="mt-8 space-y-1">
              <h3 className="text-lg font-bold text-neutral-900 group-hover:text-white transition-colors duration-300">
                {item.category}
              </h3>
              <p className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors duration-300">
                {item.subtitle}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-200/60 group-hover:border-neutral-800 flex items-center justify-between text-xs font-semibold text-neutral-900 group-hover:text-white transition-colors">
              <span>View Collection</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
