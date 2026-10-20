import Link from "next/link";
import Products from "../(component)/Product";
import { Suspense } from "react";

export default function FeaturedItems() {
  return (
    <div className="w-full px-5 md:px-16 py-16 mt-10">
      <div className="w-full flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-neutral-900">
            Featured Shoes & Parfums
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Handcrafted footwear and luxury fragrances engineered for everyday sophistication
          </p>
        </div>
        <Link
          href="/products"
          className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-black hover:text-neutral-600 underline underline-offset-4 cursor-pointer shrink-0"
        >
          View All
        </Link>
      </div>
      <Suspense fallback={
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-6 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex flex-col gap-2.5">
              <div className="w-full aspect-square bg-neutral-200 rounded-xl" />
              <div className="h-3.5 bg-neutral-200 rounded w-3/4" />
              <div className="h-3 bg-neutral-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      }>
        <Products limit={8} />
      </Suspense>
    </div>
  );
}
