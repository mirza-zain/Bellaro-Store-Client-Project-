'use client';

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Percent, Plus, Tag, Trash2, X, Zap } from "lucide-react";
import { DiscountCode } from "@/app/db/schema";
import {
  createDiscountCodeAction,
  deleteDiscountCodeAction,
} from "@/app/lib/actions/admin";

interface Props {
  initialCodes: DiscountCode[];
}

export default function DiscountManager({ initialCodes }: Props) {
  const router = useRouter();
  const [codes, setCodes] = useState<DiscountCode[]>(initialCodes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("0");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setCodes(initialCodes);
  }, [initialCodes]);

  const handleCreateCode = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("code", code);
    formData.append("discountPercent", discountPercent);
    formData.append("minOrderAmount", minOrderAmount);

    startTransition(async () => {
      const res = await createDiscountCodeAction(formData);
      if (res.success) {
        setIsModalOpen(false);
        setCode("");
        setDiscountPercent("");
        setMinOrderAmount("0");
        setMessage("Discount code created successfully!");
        router.refresh();
        setTimeout(() => setMessage(null), 3000);
      } else {
        alert(res.error || "Failed to create discount code.");
      }
    });
  };

  const handleDeleteCode = (id: number) => {
    if (!confirm("Are you sure you want to delete this discount code?")) return;
    setCodes((prev) => prev.filter((c) => c.id !== id));

    startTransition(async () => {
      const res = await deleteDiscountCodeAction(id);
      if (res.success) {
        setMessage("Discount code removed.");
        router.refresh();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setCodes(initialCodes);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Discount Codes & Store Rules
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Create coupon codes, configure promotional percentages, and manage store checkout discounts.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-sm font-medium rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Discount Code</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm">
          {message}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase">Live Discount Codes</p>
            <p className="text-2xl font-bold text-neutral-900 mt-0.5">{codes.length} Active</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase">Free Shipping Rule</p>
            <p className="text-2xl font-bold text-neutral-900 mt-0.5">PKR 8,000</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase">Checkout Verification</p>
            <p className="text-2xl font-bold text-neutral-900 mt-0.5">Live Database</p>
          </div>
        </div>
      </div>

      {/* Real Database Coupons Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">Custom Promo Codes</h2>
          <span className="text-xs text-neutral-500">Validated on checkout</span>
        </div>

        {codes.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 space-y-3">
            <Tag className="w-8 h-8 mx-auto text-neutral-300" />
            <p>No custom discount codes in database yet.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm font-semibold text-black underline cursor-pointer"
            >
              Create your first discount code
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {codes.map((c) => (
              <div
                key={c.id}
                className="p-4 flex items-center justify-between hover:bg-neutral-50/60 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-black text-white text-xs font-mono font-bold rounded-lg tracking-wider">
                    {c.code}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {c.discountPercent}% Discount
                    </p>
                    <p className="text-xs text-neutral-400">
                      {Number(c.minOrderAmount) > 0
                        ? `Min order: PKR ${Number(c.minOrderAmount).toLocaleString()}`
                        : "No minimum spend required"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                  <button
                    onClick={() => handleDeleteCode(c.id)}
                    disabled={isPending}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                    title="Delete code"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900">Create Discount Code</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCode} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER20 or SALE15"
                  className="w-full px-3 py-2 text-sm uppercase font-mono bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  Discount Percentage (%) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="20"
                  className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  Minimum Order Amount (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  placeholder="0 (no minimum)"
                  className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-semibold bg-black hover:bg-neutral-800 text-white rounded-xl shadow-xs transition"
                >
                  {isPending ? "Saving..." : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

