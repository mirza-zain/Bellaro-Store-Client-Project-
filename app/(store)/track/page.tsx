'use client';

import React, { useState, useEffect, useTransition, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Package,
  Search,
  Truck,
  AlertCircle,
  XCircle,
  Printer,
  MapPin,
  CreditCard,
  Building2,
  ExternalLink,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { trackOrderAction } from "@/app/lib/actions/orderTracking";
import { submitProductReviewAction } from "@/app/lib/actions/reviews";
import { Order, OrderItem } from "@/app/db/schema";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("orderId") || searchParams.get("email") || "";

  const [query, setQuery] = useState(initialQuery);
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [copiedTrackingId, setCopiedTrackingId] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCopyTrackingId = (trackingId: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(trackingId);
      setCopiedTrackingId(true);
      setTimeout(() => setCopiedTrackingId(false), 2000);
    }
  };

  // Review modal state
  const [reviewItem, setReviewItem] = useState<{ item: OrderItem; order: Order } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number | null>(null);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isReviewPending, startReviewTransition] = useTransition();

  const performSearch = (searchVal: string) => {
    if (!searchVal.trim()) return;
    startTransition(async () => {
      const found = await trackOrderAction(searchVal);
      setOrder(found);
      setSearched(true);

      if (found) {
        try {
          const trackingCode = found.orderCode || `BAZ-${found.id.toString().padStart(4, "0")}`;
          const trackedOrderData = {
            orderId: found.id,
            formattedId: trackingCode,
            customerName: found.customerName,
            email: found.customerEmail,
            productIds: found.items ? found.items.map((i: any) => i.productId) : [],
            timestamp: Date.now(),
          };
          const existingRaw = localStorage.getItem("bazzario_recent_orders");
          let existingOrders: any[] = [];
          if (existingRaw) {
            try {
              existingOrders = JSON.parse(existingRaw);
            } catch {}
          }
          const updated = [trackedOrderData, ...existingOrders.filter((o: any) => o.orderId !== found.id)].slice(0, 10);
          localStorage.setItem("bazzario_recent_orders", JSON.stringify(updated));
          localStorage.setItem("bazzario_last_order", JSON.stringify(trackedOrderData));
        } catch (e) {
          console.error("Failed caching order in localStorage", e);
        }
      }
    });
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewItem) return;
    setReviewError(null);
    setReviewSuccess(null);

    startReviewTransition(async () => {
      const res = await submitProductReviewAction({
        productId: reviewItem.item.productId,
        orderId: reviewItem.order.id,
        customerName: reviewItem.order.customerName,
        customerEmail: reviewItem.order.customerEmail,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });

      if (res.success) {
        setReviewSuccess("Review submitted and verified! Thank you for your feedback.");
        setTimeout(() => {
          setReviewItem(null);
          setReviewSuccess(null);
        }, 2200);
      } else {
        setReviewError(res.error || "Failed to submit review.");
      }
    });
  };

  const steps = [
    { label: "Order Placed", desc: "Received in system" },
    { label: "Processing", desc: "Packed & verified" },
    { label: "Dispatched", desc: "With express courier" },
    { label: "Delivered", desc: "Received at doorstep" },
  ];

  const getStepIndex = (status: string) => {
    const s = status.toLowerCase();
    if (s === "delivered") return 3;
    if (s === "shipped" || s === "dispatched") return 2;
    if (s === "processing") return 1;
    return 0; // pending / order placed
  };

  const isCancelled = order?.status.toLowerCase() === "cancelled";

  return (
    <div className="w-full max-w-5xl mx-auto px-5 md:px-12 py-10">
      {/* Back to Home */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="text-center pb-8 border-b border-neutral-200">
        <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-neutral-900">
          Track Your Order
        </h1>
        <p className="text-neutral-500 text-sm md:text-base mt-2 max-w-md mx-auto">
          Enter your unique Tracking Code (e.g. BAZ-4829) or checkout email to see live delivery status & courier updates.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="mt-8">
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. BAZ-4829 or customer@gmail.com"
              className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-hidden focus:border-black transition font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="px-8 py-3.5 bg-black text-white text-sm font-semibold rounded-2xl hover:bg-neutral-800 transition cursor-pointer shadow-xs shrink-0 disabled:opacity-60"
          >
            {isPending ? "Tracking..." : "Track Package"}
          </button>
        </form>
      </div>

      {/* Result Card */}
      {searched && (
        <div className="mt-10">
          {order ? (
            <div className="bg-white p-6 sm:p-10 rounded-3xl border border-neutral-200 shadow-sm space-y-8 animate-in fade-in duration-300">
              {/* Header with Order ID & Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                <div>
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                    Order Tracking
                  </span>
                  <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                    <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 font-mono">
                      {order.orderCode || `BAZ-${order.id.toString().padStart(4, "0")}`}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopyTrackingId(order.orderCode || `BAZ-${order.id.toString().padStart(4, "0")}`)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition active:scale-95 cursor-pointer shadow-2xs"
                      title="Copy Tracking ID"
                    >
                      {copiedTrackingId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                          <span className="text-emerald-700 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isCancelled
                          ? "bg-rose-100 text-rose-800"
                          : order.status === "Delivered"
                          ? "bg-emerald-100 text-emerald-800"
                          : order.status === "Processing" || order.status === "Shipped"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  {order.createdAt && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Placed on{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-PK", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-100 rounded-xl text-xs font-semibold text-neutral-800 hover:bg-neutral-200 transition"
                  >
                    <span>Support</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Progress Timeline Stepper */}
              {isCancelled ? (
                <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800">
                  <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">This order has been cancelled</h4>
                    <p className="text-xs mt-0.5 text-rose-700">
                      If you have questions about payment refunds or order cancellation, please contact our support team with your order number.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-6 px-4 bg-neutral-50/80 rounded-2xl border border-neutral-100">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    {steps.map((step, idx) => {
                      const currentIdx = getStepIndex(order.status);
                      const isCompleted = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={step.label} className="flex flex-col items-center gap-2 relative">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-xs ${
                              isCompleted
                                ? "bg-black text-white"
                                : "bg-neutral-200 text-neutral-400"
                            } ${isCurrent ? "ring-4 ring-neutral-300" : ""}`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : idx === 2 ? (
                              <Truck className="w-4 h-4" />
                            ) : idx === 1 ? (
                              <Package className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span
                              className={`block text-xs sm:text-sm font-bold ${
                                isCompleted ? "text-neutral-900" : "text-neutral-400"
                              }`}
                            >
                              {step.label}
                            </span>
                            <span className="text-[11px] text-neutral-500 hidden sm:block">
                              {step.desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Two Column Layout: Items & Shipping/Payment Details */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pt-2">
                {/* Items Ordered (3 cols) */}
                <div className="lg:col-span-3 space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-900 pb-2 border-b border-neutral-100">
                    Items in This Order ({order.items ? order.items.length : 0})
                  </h4>

                  <div className="divide-y divide-neutral-100">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((it: OrderItem, idx: number) => (
                        <div key={idx} className="py-3.5 flex items-center gap-4">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                            <Image
                              src={it.image || "/images/img1.jpg"}
                              alt={it.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-sm text-neutral-900 truncate">
                              {it.name}
                            </h5>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-neutral-500">Qty: {it.quantity}</span>
                              {it.variant && (
                                <span className="text-[11px] font-medium bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
                                  Size: {it.variant}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              PKR {Number(it.price).toLocaleString()} each
                            </p>
                            <div className="mt-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewItem({ item: it, order });
                                  setReviewRating(5);
                                  setReviewTitle("");
                                  setReviewComment("");
                                  setReviewSuccess(null);
                                  setReviewError(null);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-800 hover:text-black underline cursor-pointer"
                              >
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span>Write a Review</span>
                              </button>
                            </div>
                          </div>
                          <p className="font-semibold text-sm text-neutral-900 shrink-0">
                            PKR {(Number(it.price) * it.quantity).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-500 py-3">No line item details stored.</p>
                    )}
                  </div>
                </div>

                {/* Shipping & Payment Summary (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Shipping Address */}
                  <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-neutral-700 tracking-wider">
                      <MapPin className="w-4 h-4 text-black" />
                      <span>Delivery Address</span>
                    </div>
                    <div className="text-xs text-neutral-600 space-y-1">
                      <p className="font-semibold text-neutral-900">{order.customerName}</p>
                      <p>{order.address}</p>
                      <p className="font-medium text-neutral-800">
                        {order.city}{order.country ? `, ${order.country}` : ", Pakistan"}
                      </p>
                      {order.phone && <p className="font-mono text-neutral-500 mt-1">Phone: {order.phone}</p>}
                      <p className="text-neutral-500">Email: {order.customerEmail}</p>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-neutral-700 tracking-wider">
                      {order.paymentMethod === "bank_transfer" ? (
                        <Building2 className="w-4 h-4 text-purple-600" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                      )}
                      <span>Payment Summary</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Method</span>
                        <span className="font-semibold text-neutral-900">
                          {order.paymentMethod === "bank_transfer" ? "Bank Transfer" : "Cash on Delivery (COD)"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500">Payment Status</span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                            order.paymentStatus === "Verified"
                              ? "bg-emerald-100 text-emerald-800"
                              : order.paymentStatus === "Rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>

                      {order.discountCode && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Coupon ({order.discountCode})</span>
                          <span>-PKR {Number(order.discountAmount || 0).toLocaleString()}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-sm font-bold text-neutral-900">
                        <span>Total Amount</span>
                        <span>PKR {Number(order.totalAmount).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-neutral-50 rounded-3xl border border-neutral-200 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto" />
              <h3 className="text-xl font-bold text-neutral-900">Order Not Found</h3>
              <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                {/^\d+$/.test(query.trim())
                  ? "For customer privacy and security, order tracking requires your unique tracking code (e.g. BAZ-4829) or checkout email rather than a numeric ID."
                  : `No active order found matching "${query}". Please verify your unique tracking code (e.g. BAZ-4829) or checkout email, or get in touch with our team.`}
              </p>
              <div className="pt-3">
                <Link
                  href="/contact"
                  className="inline-block px-6 py-2.5 bg-black text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition cursor-pointer"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verified Buyer Review Modal */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 max-h-[92vh] overflow-y-auto space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Verified Purchase • Order #{reviewItem.order.id.toString().padStart(4, "0")}</span>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 leading-snug">
                  Review &quot;{reviewItem.item.name}&quot;
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setReviewItem(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{reviewError}</span>
              </div>
            )}

            {reviewSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reviewSuccess}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1.5">
                  Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setReviewHoverRating(star)}
                      onMouseLeave={() => setReviewHoverRating(null)}
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer focus:outline-hidden transition"
                      aria-label={`${star} stars`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (reviewHoverRating !== null ? reviewHoverRating : reviewRating)
                            ? "fill-amber-400 text-amber-400 scale-110"
                            : "text-neutral-300"
                        } transition-transform`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-neutral-700 ml-1">
                    {reviewRating}.0 / 5.0
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1.5">
                  Review Headline
                </label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Loved the heavy fabric and premium finish!"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1.5">
                  Your Comments *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell other buyers about the fit, quality, comfort, and delivery experience..."
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setReviewItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReviewPending}
                  className="px-6 py-2.5 bg-black text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition cursor-pointer disabled:opacity-60"
                >
                  {isReviewPending ? "Posting..." : "Publish Verified Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-4xl mx-auto px-5 py-24 text-center">
          <div className="inline-block w-8 h-8 border-3 border-neutral-300 border-t-black rounded-full animate-spin mb-3" />
          <p className="text-sm text-neutral-500">Loading order tracker...</p>
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
