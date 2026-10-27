import Link from "next/link";
import Products from "../(component)/Product";
import { Suspense } from "react";

export default function FeaturedItems() {
  return (
    <div className="w-full py-4 sm:py-6">
      <div className="w-full flex items-end justify-between gap-3 pb-2 border-b border-neutral-100">
        <div>
          <h2 className="text-xl sm:text-3xl font-extrabold uppercase tracking-tight text-neutral-900 leading-tight">
            Featured Collection
          </h2>
          <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">
            Handcrafted shoes &amp; artisanal perfumes
          </p>
        </div>
        <Link
          href="/products"
          className="text-xs font-bold uppercase tracking-wider text-black hover:text-neutral-600 underline underline-offset-4 cursor-pointer shrink-0 pb-0.5"
        >
          View All &rarr;
        </Link>
      </div>
      <Suspense fallback={
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-6 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex flex-col gap-2.5">
              <div className="w-full aspect-[4/5] bg-neutral-200 rounded-xl" />
              <div className="h-3.5 bg-neutral-200 rounded w-3/4" />
              <div className="h-3 bg-neutral-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      }>
        <Products limit={12} />
      </Suspense>
    </div>
  );
}
