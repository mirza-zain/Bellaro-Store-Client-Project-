import React from "react";
import { Star, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";

interface ReviewItem {
  id: number;
  rating: number;
  title: string;
  quote: string;
  author: string;
  city: string;
  product: string;
  shoeSize: string;
  fit: string;
  date: string;
  verified: boolean;
}

const FOOTWEAR_REVIEWS: ReviewItem[] = [
  {
    id: 1,
    rating: 5,
    title: "Zero heel blisters or break-in pain right out of the box",
    quote:
      "Wore these brand new to a 6-hour wedding reception in Karachi. The inner memory insole is noticeably softer than standard formal shoes, and the calfskin leather didn't bite my ankles once. The gold horsebit finish looks exceptionally premium in person.",
    author: "Muhammad Bilal T.",
    city: "Clifton, Karachi",
    product: "Monarch Horsebit Leather Loafers",
    shoeSize: "EU 42 / UK 8",
    fit: "True to size",
    date: "3 days ago",
    verified: true,
  },
  {
    id: 2,
    rating: 5,
    title: "Immaculate shine and welting — mall brands don't compare",
    quote:
      "The patent leather gloss and clean welt stitching are extraordinary. Styled them with both dark trousers and an embroidered kurta for Jummah and evening dinners. Arrived securely packed in a branded box with individual dust bags.",
    author: "Hamza Tariq",
    city: "DHA Phase 6, Lahore",
    product: "Patent Partywear Loafers",
    shoeSize: "EU 43 / UK 9",
    fit: "True to size",
    date: "1 week ago",
    verified: true,
  },
  {
    id: 3,
    rating: 5,
    title: "Pebble sole protects the suede while driving — lightweight & snug",
    quote:
      "The studded rubber sole wraps around the heel so the suede doesn't get scuffed on car pedals. Wore them for a full day of meetings and hospital rounds. Sizing consultation on WhatsApp gave me the exact right fit before dispatch.",
    author: "Dr. Daniyal Ahmed",
    city: "F-7, Islamabad",
    product: "Modena Suede Driving Moccasins",
    shoeSize: "EU 41 / UK 7",
    fit: "True to size",
    date: "2 weeks ago",
    verified: true,
  },
  {
    id: 4,
    rating: 5,
    title: "Real arch support and thick cushioning, not flat cardboard",
    quote:
      "Most designer slides feel like flat plastic after 20 minutes of walking. Bellaro's footbed has genuine memory cushion and arch contour. The leather cross-straps are soft against bare skin. Worth every rupee.",
    author: "Usman Sheikh",
    city: "Rawalpindi",
    product: "Classic Check Cross-Strap Slides",
    shoeSize: "EU 42 / UK 8",
    fit: "True to size",
    date: "3 weeks ago",
    verified: true,
  },
];

export default function Reviews() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header with verified badge summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 rounded-full text-[10px] sm:text-xs font-bold tracking-wider text-neutral-700 uppercase mb-2 border border-neutral-200/80">
            <ShieldCheck className="w-3.5 h-3.5 text-black" />
            <span>Verified Footwear Impressions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900">
            Tested on Real Feet Across Pakistan
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-xl leading-relaxed">
            Authentic feedback from verified customers wearing Bellaro handcrafted loafers, driving moccasins, and designer slides.
          </p>
        </div>

        {/* Rating summary counter */}
        <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200/80 rounded-2xl px-4 py-3 shrink-0">
          <div className="flex items-center gap-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <div className="border-l border-neutral-200 pl-3">
            <p className="text-xs font-bold text-neutral-900 leading-tight">4.9 / 5.0 Rating</p>
            <p className="text-[10px] text-neutral-500">Based on 1,200+ footwear orders</p>
          </div>
        </div>
      </div>

      {/* 4-Card Grid of Realistic Customer Reviews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {FOOTWEAR_REVIEWS.map((review) => (
          <div
            key={review.id}
            className="flex flex-col justify-between p-5 sm:p-6 bg-white rounded-2xl border border-neutral-200/90 hover:border-black transition-all duration-200 shadow-xs hover:shadow-md"
          >
            <div>
              {/* Stars, Verified Buyer Badge & Date */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Verified</span>
                </span>
              </div>

              {/* Review Title */}
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug mb-2">
                &ldquo;{review.title}&rdquo;
              </h3>

              {/* Review Comment Quote */}
              <p className="text-xs text-neutral-600 leading-relaxed line-clamp-6">
                {review.quote}
              </p>
            </div>

            {/* Author, Location & Shoe Details */}
            <div className="mt-6 pt-4 border-t border-neutral-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-neutral-900 leading-tight">
                    {review.author}
                  </h4>
                  <p className="text-[10px] text-neutral-400 flex items-center gap-0.5 mt-0.5">
                    <MapPin className="w-3 h-3 text-neutral-400" />
                    <span>{review.city}</span>
                  </p>
                </div>
                <span className="text-[10px] text-neutral-400">{review.date}</span>
              </div>

              {/* Shoe Model & Fit Pill */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-md truncate max-w-full">
                  {review.product}
                </span>
                <span className="text-[10px] font-medium text-neutral-500 bg-neutral-50 border border-neutral-200/70 px-1.5 py-0.5 rounded-md">
                  {review.shoeSize} • {review.fit}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
