import React from "react";
import { Star } from "lucide-react";

interface ReviewItem {
  id: number;
  rating: number;
  quote: string;
  author: string;
  product: string;
}

const REVIEWS: ReviewItem[] = [
  {
    id: 1,
    rating: 5,
    quote:
      "The calfskin finish is impeccable right out of the box. Cushioning inside is noticeably softer than standard formal shoes — wore them for an entire reception without any break-in discomfort.",
    author: "Hassan R.",
    product: "MONARCH HORSEBIT LOAFERS",
  },
  {
    id: 2,
    rating: 5,
    quote:
      "Velvet Amber is warm, opulent, and never cloying. It opens with subtle spicy citrus and settles into rich smoky vanilla and amber. Two sprays easily lasted past an 8-hour day.",
    author: "Areeba M.",
    product: "VELVET AMBER EDP",
  },
  {
    id: 3,
    rating: 5,
    quote:
      "Extremely comfortable driving shoe with great pebble grip. The suede texture feels premium and holds its shape nicely. Easily dressed up with trousers or casually with denim.",
    author: "Usman K.",
    product: "MODENA SUEDE MOCCASINS",
  },
  {
    id: 4,
    rating: 5,
    quote:
      "Best everyday luxury slides I've owned. The molded footbed provides real arch support rather than feeling flat. Minimalist, clean silhouette with high-grade durable leather.",
    author: "Bilal A.",
    product: "ROYALE CROSS-STRAP SLIDES",
  },
];

export default function Reviews() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header matching Zarb style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-12">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-neutral-400 uppercase">
            THE BELLARO EDIT
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-neutral-900 mt-1">
            Loved for the finish &amp; scent
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-xs md:text-right leading-relaxed">
          Footwear and fragrance impressions from people who made Bellaro part of their routine.
        </p>
      </div>

      {/* 4-Card Grid matching Zarb visual structure */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {REVIEWS.map((review) => (
          <div
            key={review.id}
            className="flex flex-col justify-between p-6 sm:p-7 bg-white rounded-none border border-neutral-200/90 hover:border-neutral-400 transition-colors duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            <div>
              {/* 5 Amber Stars */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 fill-amber-500 text-amber-500"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                &ldquo;{review.quote}&rdquo;
              </p>
            </div>

            {/* Author & Product (Clean Zarb-style layout without heavy dividing line) */}
            <div className="mt-8">
              <h4 className="text-xs sm:text-sm font-semibold text-neutral-900">
                {review.author}
              </h4>
              <p className="text-[10px] sm:text-[11px] tracking-wider text-neutral-400 uppercase mt-0.5 font-medium">
                {review.product}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
