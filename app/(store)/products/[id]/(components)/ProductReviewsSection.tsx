'use client';

import React, { useState, useEffect, useTransition } from "react";
import {
  Star,
  CheckCircle2,
  MessageSquare,
  Plus,
  X,
  ShieldCheck,
  AlertCircle,
  ThumbsUp,
  Sparkles,
  Check,
} from "lucide-react";
import {
  ProductReviewsSummary,
  submitProductReviewAction,
  findVerifiedOrderAction,
} from "@/app/lib/actions/reviews";

interface Props {
  productId: number;
  productName: string;
  summary: ProductReviewsSummary;
}

export default function ProductReviewsSection({
  productId,
  productName,
  summary,
}: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    orderId: "",
    title: "",
    comment: "",
  });

  const [autoDetectedSource, setAutoDetectedSource] = useState<string | null>(null);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Auto-detect purchase from URL params or localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. URL search params (e.g. /products/1?orderId=1&email=...&name=...)
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlOrderId = searchParams.get("orderId");
      const urlEmail = searchParams.get("email");
      const urlName = searchParams.get("name");

      if (urlOrderId || urlEmail || urlName) {
        const formattedId = urlOrderId
          ? urlOrderId.startsWith("#ORD-")
            ? urlOrderId
            : `#ORD-${urlOrderId.toString().padStart(4, "0")}`
          : "";

        setFormData((prev) => ({
          ...prev,
          orderId: formattedId || prev.orderId,
          email: urlEmail || prev.email,
          name: urlName || prev.name,
        }));

        if (formattedId) {
          setAutoDetectedSource(formattedId);
        }
        setIsFormOpen(true);
        return;
      }
    } catch (e) {
      console.error("Error reading URL search params:", e);
    }

    // 2. LocalStorage detection
    try {
      const stored = localStorage.getItem("bazzario_recent_orders");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const matchingOrder = parsed.find((o: any) =>
            Array.isArray(o.productIds) && o.productIds.includes(productId)
          );

          if (matchingOrder) {
            const formattedId = matchingOrder.formattedId || `#ORD-${matchingOrder.orderId.toString().padStart(4, "0")}`;
            setFormData((prev) => ({
              ...prev,
              orderId: formattedId,
              email: matchingOrder.email || prev.email,
              name: matchingOrder.customerName || prev.name,
            }));
            setAutoDetectedSource(formattedId);
          } else {
            // Pre-fill user's contact info if they bought something else recently
            const latest = parsed[0];
            if (latest) {
              setFormData((prev) => ({
                ...prev,
                email: prev.email || latest.email || "",
                name: prev.name || latest.customerName || "",
              }));
            }
          }
        }
      }
    } catch (e) {
      console.error("Error reading stored orders:", e);
    }
  }, [productId]);

  // When email changes or blurs, if orderId is missing, check verified purchases via server action
  const handleEmailBlur = async () => {
    const cleanEmail = formData.email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) return;

    if (!formData.orderId) {
      setIsVerifyingEmail(true);
      try {
        const res = await findVerifiedOrderAction(cleanEmail, productId);
        if (res.found && res.formattedOrderId) {
          setFormData((prev) => ({
            ...prev,
            orderId: res.formattedOrderId || prev.orderId,
            name: prev.name || res.customerName || "",
          }));
          setAutoDetectedSource(res.formattedOrderId);
        }
      } catch (err) {
        console.error("Error looking up verified order:", err);
      } finally {
        setIsVerifyingEmail(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await submitProductReviewAction({
        productId,
        customerName: formData.name,
        customerEmail: formData.email,
        orderId: formData.orderId || undefined,
        rating,
        title: formData.title,
        comment: formData.comment,
      });

      if (res.success) {
        setSuccessMessage("Thank you! Your verified customer review has been published.");
        setFormData({ name: "", email: "", orderId: "", title: "", comment: "" });
        setAutoDetectedSource(null);
        setRating(5);
        setTimeout(() => {
          setIsFormOpen(false);
          setSuccessMessage(null);
        }, 3000);
      } else {
        setErrorMessage(res.error || "Failed to submit review.");
      }
    });
  };

  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <section className="mt-16 pt-12 border-t border-neutral-200">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-neutral-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Verified Feedback
          </span>
          <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-neutral-900 mt-1">
            Customer Reviews
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Real feedback from verified purchasers across Pakistan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-black text-white text-sm font-semibold rounded-2xl hover:bg-neutral-800 transition shadow-xs cursor-pointer self-start md:self-auto"
        >
          {isFormOpen ? (
            <>
              <X className="w-4 h-4" />
              <span>Cancel Review</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Write a Review</span>
            </>
          )}
        </button>
      </div>

      {/* Auto-detected purchase banner for verified buyers */}
      {autoDetectedSource && !isFormOpen && (
        <div className="mt-6 p-4.5 bg-emerald-50 border border-emerald-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-950">
                Verified Purchase Detected ({autoDetectedSource})
              </p>
              <p className="text-xs text-emerald-700">
                Your order ID and contact details have been automatically linked.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="px-5 py-2.5 bg-emerald-800 text-white text-xs font-semibold rounded-xl hover:bg-emerald-900 transition self-start sm:self-auto cursor-pointer shadow-xs"
          >
            Leave Verified Review
          </button>
        </div>
      )}

      {/* Review Submission Form Modal / Collapsible */}
      {isFormOpen && (
        <div className="my-8 p-6 sm:p-8 bg-neutral-50 rounded-3xl border border-neutral-200 animate-in fade-in duration-200">
          <div className="max-w-2xl mx-auto space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Purchase Review</span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900">
                Review &quot;{productName}&quot;
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {autoDetectedSource
                  ? `Your order details for ${autoDetectedSource} were automatically filled. Rate your purchase below!`
                  : "Enter your checkout email or Order ID. Your verified order details will be automatically matched."}
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs sm:text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1.5">
                  Your Overall Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer focus:outline-hidden transition"
                      aria-label={`${star} stars`}
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= activeRating
                            ? "fill-amber-400 text-amber-400 scale-110"
                            : "text-neutral-300"
                        } transition-transform`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-neutral-700 ml-2">
                    {activeRating === 5
                      ? "5.0 - Excellent"
                      : activeRating === 4
                      ? "4.0 - Very Good"
                      : activeRating === 3
                      ? "3.0 - Average"
                      : activeRating === 2
                      ? "2.0 - Poor"
                      : "1.0 - Terrible"}
                  </span>
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Hamza Ali"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1.5">
                    Checkout Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onBlur={handleEmailBlur}
                    placeholder="email@example.com"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              {/* Order ID & Review Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase text-neutral-700">
                      Order ID
                    </label>
                    {autoDetectedSource ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>Auto-Filled</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-400">Recommended</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.orderId}
                      onChange={(e) => {
                        setFormData({ ...formData, orderId: e.target.value });
                        if (autoDetectedSource && e.target.value !== autoDetectedSource) {
                          setAutoDetectedSource(null);
                        }
                      }}
                      placeholder="e.g. #ORD-0001 or 1"
                      className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black font-mono pr-8"
                    />
                    {formData.orderId && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, orderId: "" });
                          setAutoDetectedSource(null);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
                        title="Clear Order ID"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {autoDetectedSource ? (
                    <p className="text-[11px] text-emerald-700 mt-1.5 flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span>Verified buyer matched to {autoDetectedSource}</span>
                    </p>
                  ) : (
                    <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-500">
                      <span>Auto-detects from your email</span>
                      {formData.email && formData.email.includes("@") && (
                        <button
                          type="button"
                          disabled={isVerifyingEmail}
                          onClick={handleEmailBlur}
                          className="text-black font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isVerifyingEmail ? (
                            <span>Finding order...</span>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>Auto-find Order</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1.5">
                    Review Headline
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Insane quality, perfect fit!"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              {/* Detailed Comment */}
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1.5">
                  Detailed Feedback *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Share details regarding the fabric weight, sizing fit, color accuracy, and overall experience..."
                  className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-neutral-600 hover:text-black cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="px-7 py-3 bg-black text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {isPending ? "Verifying & Posting..." : "Submit Verified Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ratings Breakdown Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 items-center">
        {/* Score Card */}
        <div className="flex flex-col items-center justify-center p-6 bg-neutral-50 rounded-3xl border border-neutral-100 text-center">
          <p className="text-5xl font-black text-neutral-900 tracking-tight">
            {summary.totalReviews > 0 ? summary.averageRating.toFixed(1) : "5.0"}
          </p>
          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(summary.averageRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-neutral-300"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-neutral-500 font-medium">
            Based on {summary.totalReviews} verified {summary.totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>

        {/* 5-to-1 Star Distribution Bars */}
        <div className="md:col-span-2 space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = summary.distribution[stars] || 0;
            const pct = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-neutral-600 font-medium text-right shrink-0">
                  {stars} stars
                </span>
                <div className="flex-1 bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-neutral-900 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-neutral-400 text-left shrink-0">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="mt-6 space-y-4">
        {summary.reviews.length === 0 ? (
          <div className="py-16 text-center bg-neutral-50 rounded-3xl border border-dashed border-neutral-200 space-y-3">
            <MessageSquare className="w-10 h-10 text-neutral-400 mx-auto" />
            <h4 className="font-bold text-neutral-800 text-base">No reviews yet</h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Have you ordered this item? Be the first verified customer to share your thoughts on quality, sizing, and comfort!
            </p>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="mt-2 px-5 py-2.5 bg-black text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition cursor-pointer"
            >
              Write First Review
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {summary.reviews.map((rev) => (
              <div key={rev.id} className="py-6 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900">
                      {rev.customerName}
                    </span>
                    {rev.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Verified Buyer</span>
                      </span>
                    )}
                  </div>

                  {rev.createdAt && (
                    <span className="text-xs text-neutral-400">
                      {new Date(rev.createdAt).toLocaleDateString("en-PK", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>

                {/* Stars & Title */}
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-neutral-200"
                        }`}
                      />
                    ))}
                  </div>

                  {rev.title && (
                    <h5 className="font-bold text-sm text-neutral-900">{rev.title}</h5>
                  )}
                </div>

                <p className="text-sm text-neutral-600 leading-relaxed max-w-3xl">
                  {rev.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
