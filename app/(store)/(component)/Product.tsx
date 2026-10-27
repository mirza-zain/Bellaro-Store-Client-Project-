import Image from "next/image";
import Link from "next/link";
import { getStoreProducts } from "@/app/lib/actions/store";

type Prop = {
  limit?: number;
  category?: string;
};

// Fallback curated Bellaro products shown when database is awaiting sync
const curatedBellaroProducts = [
  {
    id: 1,
    name: "Bellaro Monarch Horsebit Leather Loafers",
    description: "Signature handcrafted genuine leather horsebit loafers featuring polished gold metallic horsebit hardware, full leather lining, and durable lug soles.",
    category: "Footwear",
    subCategory: "Loafers",
    price: "5850",
    stock: "20",
    image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80",
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
  },
];

export default async function Products({ limit, category }: Prop) {
  const dbProducts = await getStoreProducts({ limit, category });
  const displayProducts = dbProducts.length > 0 ? dbProducts : curatedBellaroProducts;

  const filtered = category
    ? displayProducts.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      )
    : displayProducts;

  const finalProducts = limit ? filtered.slice(0, limit) : filtered;

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6 mt-6">
        {finalProducts.map((item) => (
          <Link
            href={`/products/${item.id}`}
            key={item.id}
            className="group flex flex-col gap-2 sm:gap-3"
          >
            <div className="relative w-full aspect-[4/5] overflow-hidden rounded-xl sm:rounded-2xl bg-neutral-100 border border-neutral-200/60 shadow-xs">
              <Image
                src={
                  item.image && !item.image.includes("/images/img1.jpg")
                    ? item.image
                    : item.category === "Perfumes"
                    ? "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80"
                    : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"
                }
                alt={item.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
              />
              {Number(item.stock) <= 0 && (
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-neutral-900/90 text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg backdrop-blur-xs">
                  Out of Stock
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xs sm:text-base font-semibold text-neutral-900 group-hover:text-neutral-600 transition truncate">
                {item.name}
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-neutral-400 uppercase mt-0.5 truncate">
                <span>{item.category}</span>
                <span>•</span>
                <span>{item.subCategory}</span>
                {item.category?.toLowerCase() === "footwear" && (item as any).variants && (item as any).variants.length > 0 && (
                  (() => {
                    const rawVariants: any[] = (item as any).variants || [];
                    const hasKids = rawVariants.some((v) => {
                      const num = parseInt(String(v.label).replace(/\D/g, ""), 10);
                      return !isNaN(num) && num >= 28 && num <= 38;
                    });
                    const hasAdults = rawVariants.some((v) => {
                      const num = parseInt(String(v.label).replace(/\D/g, ""), 10);
                      return !isNaN(num) && num >= 39 && num <= 48;
                    });
                    if (hasKids && hasAdults) {
                      return (
                        <>
                          <span>•</span>
                          <span className="text-neutral-700 font-bold normal-case">Adult &amp; Kids</span>
                        </>
                      );
                    }
                    if (hasKids) {
                      return (
                        <>
                          <span>•</span>
                          <span className="text-amber-800 font-bold normal-case">🧒 Kids</span>
                        </>
                      );
                    }
                    if (hasAdults) {
                      return (
                        <>
                          <span>•</span>
                          <span className="text-neutral-700 font-bold normal-case">👞 Adults</span>
                        </>
                      );
                    }
                    return null;
                  })()
                )}
              </div>
              <p className="text-xs sm:text-sm md:text-base font-bold text-neutral-900 mt-1">
                PKR {Number(item.price).toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
