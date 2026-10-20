'use client';

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  DollarSign,
  Edit,
  MapPin,
  Percent,
  Plus,
  Settings,
  Tag,
  Trash2,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { DiscountCode, ShippingRule } from "@/app/db/schema";
import {
  createDiscountCodeAction,
  deleteDiscountCodeAction,
} from "@/app/lib/actions/admin";
import {
  saveDefaultShippingAction,
  addOrUpdateCityShippingRuleAction,
  deleteShippingRuleAction,
} from "@/app/lib/actions/shipping";

interface Props {
  initialCodes: DiscountCode[];
  initialShippingRules: ShippingRule[];
}

export default function PricingAndShippingManager({
  initialCodes,
  initialShippingRules,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"shipping" | "discounts">("shipping");

  // Discount Codes state
  const [codes, setCodes] = useState<DiscountCode[]>(initialCodes);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("0");

  // Shipping Rules state
  const [shippingRulesList, setShippingRulesList] = useState<ShippingRule[]>(initialShippingRules);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [editingCityRule, setEditingCityRule] = useState<ShippingRule | null>(null);
  const [cityInput, setCityInput] = useState("");
  const [chargeInput, setChargeInput] = useState("");

  // Default Shipping Settings state
  const defaultRule = shippingRulesList.find(
    (r) => r.isDefault || r.city.trim().toUpperCase() === "DEFAULT"
  ) || {
    id: 0,
    city: "DEFAULT",
    charge: "250",
    freeShippingThreshold: "8000",
    isDefault: true,
    isActive: true,
    createdAt: null,
  };

  const [defaultCharge, setDefaultCharge] = useState(defaultRule.charge);
  const [freeThreshold, setFreeThreshold] = useState(defaultRule.freeShippingThreshold || "8000");
  const [isFreeShippingActive, setIsFreeShippingActive] = useState(defaultRule.isActive);

  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Synchronize on server revalidations
  useEffect(() => {
    setCodes(initialCodes);
    setShippingRulesList(initialShippingRules);
    const def = initialShippingRules.find(
      (r) => r.isDefault || r.city.trim().toUpperCase() === "DEFAULT"
    );
    if (def) {
      setDefaultCharge(def.charge);
      setFreeThreshold(def.freeShippingThreshold || "8000");
      setIsFreeShippingActive(def.isActive);
    }
  }, [initialCodes, initialShippingRules]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save Default Shipping & Free Shipping Threshold
  const handleSaveDefaultSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const chargeNum = Number(defaultCharge) || 0;
    const thresholdNum = Number(freeThreshold) || 0;

    startTransition(async () => {
      const res = await saveDefaultShippingAction({
        charge: chargeNum,
        freeShippingThreshold: thresholdNum,
        isActive: isFreeShippingActive,
      });

      if (res.success) {
        showToast("Default delivery rate and free shipping threshold updated!");
        router.refresh();
      } else {
        showToast(res.error || "Failed to save shipping settings.", "error");
      }
    });
  };

  // Add / Edit City Shipping Rule
  const handleSaveCityRule = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCity = cityInput.trim();
    const chargeNum = Number(chargeInput);

    if (!rawCity || isNaN(chargeNum)) {
      showToast("Please enter a valid city name and charge amount.", "error");
      return;
    }

    startTransition(async () => {
      const res = await addOrUpdateCityShippingRuleAction({
        city: rawCity,
        charge: chargeNum,
        freeShippingThreshold: Number(freeThreshold) || 8000,
      });

      if (res.success) {
        setIsCityModalOpen(false);
        setEditingCityRule(null);
        setCityInput("");
        setChargeInput("");
        showToast(`Shipping rate for "${rawCity}" saved successfully!`);
        router.refresh();
      } else {
        showToast(res.error || "Failed to save city shipping rate.", "error");
      }
    });
  };

  // Delete City Shipping Rule
  const handleDeleteCityRule = (id: number, cityName: string) => {
    if (!confirm(`Are you sure you want to delete delivery rate for "${cityName}"?`)) return;

    setShippingRulesList((prev) => prev.filter((r) => r.id !== id));

    startTransition(async () => {
      const res = await deleteShippingRuleAction(id);
      if (res.success) {
        showToast(`Rate for "${cityName}" removed.`);
        router.refresh();
      } else {
        showToast(res.error || "Failed to delete rate.", "error");
        setShippingRulesList(initialShippingRules);
      }
    });
  };

  // Create Coupon Code
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("code", couponCode.trim().toUpperCase());
    formData.append("discountPercent", discountPercent);
    formData.append("minOrderAmount", minOrderAmount);

    startTransition(async () => {
      const res = await createDiscountCodeAction(formData);
      if (res.success) {
        setIsCouponModalOpen(false);
        setCouponCode("");
        setDiscountPercent("");
        setMinOrderAmount("0");
        showToast("Discount code created successfully!");
        router.refresh();
      } else {
        showToast(res.error || "Failed to create discount code.", "error");
      }
    });
  };

  // Delete Coupon Code
  const handleDeleteCoupon = (id: number, codeText: string) => {
    if (!confirm(`Are you sure you want to delete coupon code "${codeText}"?`)) return;
    setCodes((prev) => prev.filter((c) => c.id !== id));

    startTransition(async () => {
      const res = await deleteDiscountCodeAction(id);
      if (res.success) {
        showToast(`Coupon "${codeText}" removed.`);
        router.refresh();
      } else {
        showToast(res.error || "Failed to delete coupon.", "error");
        setCodes(initialCodes);
      }
    });
  };

  const isWritingDefaultCity = cityInput.trim().toUpperCase() === "DEFAULT";

  return (
    <div className="space-y-8">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl text-sm flex items-center justify-between border shadow-sm transition animate-fade-in ${
            toastMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-neutral-400 hover:text-neutral-800 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Pricing, Discounts & Shipping Rules
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Configure free shipping thresholds, default & city delivery rates, and checkout promo codes.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("shipping")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === "shipping"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Shipping & Delivery Rules</span>
          </button>
          <button
            onClick={() => setActiveTab("discounts")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === "discounts"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Promo Coupons ({codes.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SHIPPING & DELIVERY RULES */}
      {activeTab === "shipping" && (
        <div className="space-y-8 animate-fade-in">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Free Shipping Rule
                </p>
                <p className="text-2xl font-bold text-neutral-900 mt-0.5">
                  {isFreeShippingActive ? `PKR ${Number(freeThreshold).toLocaleString()}` : "Disabled"}
                </p>
                <span className="text-[11px] text-emerald-600 font-medium">
                  {isFreeShippingActive ? "Orders over threshold are FREE" : "Free shipping currently OFF"}
                </span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Default Fallback Rate
                </p>
                <p className="text-2xl font-bold text-neutral-900 mt-0.5">
                  PKR {Number(defaultCharge).toLocaleString()}
                </p>
                <span className="text-[11px] text-neutral-500">For unlisted destinations</span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Custom City Rates
                </p>
                <p className="text-2xl font-bold text-neutral-900 mt-0.5">
                  {shippingRulesList.filter((r) => !r.isDefault && r.city.toUpperCase() !== "DEFAULT").length} Cities
                </p>
                <span className="text-[11px] text-neutral-500">Configured region fees</span>
              </div>
            </div>
          </div>

          {/* Form: Global Rules Configuration */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">
                  Global Shipping & Delivery Defaults
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Set the free shipping threshold and the default delivery fee applied when no custom city charge is found.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveDefaultSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Free Shipping Threshold */}
                <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Free Shipping Threshold (PKR)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={isFreeShippingActive}
                        onChange={(e) => setIsFreeShippingActive(e.target.checked)}
                        className="w-4 h-4 rounded text-black focus:ring-black accent-black"
                      />
                      <span>Enable Free Shipping</span>
                    </label>
                  </div>

                  <input
                    type="number"
                    min="0"
                    required
                    value={freeThreshold}
                    onChange={(e) => setFreeThreshold(e.target.value)}
                    placeholder="8000"
                    disabled={!isFreeShippingActive}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-neutral-900 focus:outline-hidden focus:border-black disabled:bg-neutral-100 disabled:text-neutral-400"
                  />
                  <p className="text-[11px] text-neutral-500">
                    Customers whose cart subtotal is equal to or greater than this amount will automatically qualify for <strong>FREE Shipping (PKR 0)</strong> at checkout and in the cart progress meter.
                  </p>
                </div>

                {/* 2. Default Fallback Delivery Fee */}
                <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Default Delivery Charge (PKR)
                    </label>
                    <span className="text-[11px] bg-neutral-200 text-neutral-700 font-mono px-2 py-0.5 rounded-md font-bold uppercase">
                      Fallback Rate
                    </span>
                  </div>

                  <input
                    type="number"
                    min="0"
                    required
                    value={defaultCharge}
                    onChange={(e) => setDefaultCharge(e.target.value)}
                    placeholder="250"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-neutral-900 focus:outline-hidden focus:border-black"
                  />
                  <p className="text-[11px] text-neutral-500">
                    This charge is applied to any place, city, or district where you haven’t configured a specific delivery price below. You can also write <strong>&quot;DEFAULT&quot;</strong> in the city table to set this price.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                >
                  {isPending ? "Updating..." : "Save Global Shipping Settings"}
                </button>
              </div>
            </form>
          </div>

          {/* Table: City Specific Delivery Rates */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">City & Destination Delivery Charges</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Configure special delivery rates per city (e.g. Karachi: PKR 150). All other places automatically use the Default rate (PKR {Number(defaultCharge).toLocaleString()}).
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingCityRule(null);
                  setCityInput("");
                  setChargeInput("");
                  setIsCityModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add City Delivery Rate</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200 uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Destination / City</th>
                    <th className="py-3 px-5">Delivery Fee (PKR)</th>
                    <th className="py-3 px-5">Free Shipping Eligibility</th>
                    <th className="py-3 px-5">Rule Type</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {shippingRulesList.map((r) => {
                    const isDef = r.isDefault || r.city.trim().toUpperCase() === "DEFAULT";
                    return (
                      <tr key={r.id} className="hover:bg-neutral-50/70 transition">
                        <td className="py-3.5 px-5 font-semibold text-neutral-900 flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${isDef ? "text-purple-600" : "text-neutral-400"}`} />
                          <span>{isDef ? "DEFAULT (All Unlisted Cities & Towns)" : r.city}</span>
                        </td>

                        <td className="py-3.5 px-5 font-bold text-neutral-900">
                          PKR {Number(r.charge).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-5 text-xs text-neutral-600">
                          {isFreeShippingActive ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium border border-emerald-200">
                              <Check className="w-3 h-3" />
                              <span>Free on orders &ge; PKR {Number(freeThreshold).toLocaleString()}</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400">Standard charge</span>
                          )}
                        </td>

                        <td className="py-3.5 px-5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isDef
                                ? "bg-purple-100 text-purple-900 border border-purple-200"
                                : "bg-neutral-100 text-neutral-700"
                            }`}
                          >
                            {isDef ? "Default Fallback" : "Custom City"}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCityRule(r);
                                setCityInput(r.city);
                                setChargeInput(r.charge);
                                setIsCityModalOpen(true);
                              }}
                              className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                              title="Edit Rate"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {!isDef && (
                              <button
                                onClick={() => handleDeleteCityRule(r.id, r.city)}
                                disabled={isPending}
                                className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Custom Rate"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROMO & DISCOUNT CODES */}
      {activeTab === "discounts" && (
        <div className="space-y-8 animate-fade-in">
          {/* Header Action */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Custom Promo Codes</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Manage promotional discount codes validated automatically on the store checkout page.
              </p>
            </div>

            <button
              onClick={() => setIsCouponModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Coupon Code</span>
            </button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p className="text-2xl font-bold text-neutral-900 mt-0.5">PKR {Number(freeThreshold).toLocaleString()}</p>
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

          {/* Coupons Table */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
            {codes.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 space-y-3">
                <Tag className="w-8 h-8 mx-auto text-neutral-300" />
                <p>No custom discount codes in database yet.</p>
                <button
                  onClick={() => setIsCouponModalOpen(true)}
                  className="text-xs font-semibold text-black underline cursor-pointer"
                >
                  Create your first discount code
                </button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {codes.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 flex items-center justify-between hover:bg-neutral-50/60 transition"
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
                        onClick={() => handleDeleteCoupon(c.id, c.code)}
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
        </div>
      )}

      {/* MODAL 1: Add / Edit City Shipping Rule */}
      {isCityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900">
                {editingCityRule ? `Edit Rate for ${editingCityRule.city}` : "Add City Delivery Rate"}
              </h3>
              <button
                onClick={() => setIsCityModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCityRule} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  City / Destination Name *
                </label>
                <input
                  type="text"
                  required
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="e.g. Karachi, Lahore, or DEFAULT"
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black font-medium"
                />
                {isWritingDefaultCity ? (
                  <p className="text-[11px] text-purple-700 bg-purple-50 p-2 rounded-lg mt-1.5 font-medium">
                    ⚡ &quot;DEFAULT&quot; entered: Saving this will set the fallback delivery fee for all unlisted cities.
                  </p>
                ) : (
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Tip: Writing &quot;DEFAULT&quot; sets the universal fallback price for all unconfigured locations.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  Delivery Charge (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={chargeInput}
                  onChange={(e) => setChargeInput(e.target.value)}
                  placeholder="150"
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCityModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-semibold bg-black hover:bg-neutral-800 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  {isPending ? "Saving..." : "Save Delivery Rate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Discount Code */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900">Create Discount Code</h3>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER20 or BAZAAR15"
                  className="w-full px-3.5 py-2.5 text-sm uppercase font-mono bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black font-bold"
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
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black font-semibold"
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
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-semibold bg-black hover:bg-neutral-800 text-white rounded-xl shadow-xs transition cursor-pointer"
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
