'use client';

import React, { useState, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  DollarSign,
  Package,
  Plus,
  ReceiptText,
  RotateCw,
  X,
  AlertCircle,
  Upload,
} from "lucide-react";
import { Product, Order } from "@/app/db/schema";
import {
  addProductAction,
  DashboardStats,
  getDashboardData,
  updateFootwearSizePresetsAction,
  applySizesToCategoryAction,
  FootwearSizePresets,
} from "@/app/lib/actions/admin";

const FOOTWEAR_COLOR_PRESETS = [
  { name: "White", hex: "#ffffff" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Brown", hex: "#5c4033" },
  { name: "Mustard", hex: "#e1ad01" },
  { name: "Peach", hex: "#fba476" },
  { name: "Black", hex: "#171717" },
  { name: "Dark Brown", hex: "#3e2723" },
  { name: "Tan", hex: "#b87333" },
  { name: "Navy Blue", hex: "#1a2a44" },
  { name: "Olive Green", hex: "#556b2f" },
  { name: "Charcoal Grey", hex: "#4b5563" },
  { name: "Burgundy", hex: "#6b1426" },
];

interface AdminClientViewProps {
  stats: DashboardStats;
  products: Product[];
  orders: Order[];
  initialSizePresets?: FootwearSizePresets;
}

export default function AdminClientView({
  stats,
  products,
  orders,
  initialSizePresets,
}: AdminClientViewProps) {
  const router = useRouter();
  const [ordersList, setOrdersList] = useState<Order[]>(orders);
  const [productsList, setProductsList] = useState<Product[]>(products);
  const [statsData, setStatsData] = useState<DashboardStats>(stats);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Dynamic Footwear Size Master states (Adults & Kids)
  const [adultSizesInput, setAdultSizesInput] = useState(
    initialSizePresets?.rawAdult || "39, 40, 41, 42, 43, 44, 45"
  );
  const [kidsSizesInput, setKidsSizesInput] = useState(
    initialSizePresets?.rawKids || "31, 32, 33, 34, 35, 36, 37, 38"
  );
  const [isSavingSizes, setIsSavingSizes] = useState(false);
  const [isApplyingSizes, setIsApplyingSizes] = useState(false);

  // Quick Add Product Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Footwear");
  const [subCategory, setSubCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("20");
  const [description, setDescription] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>(["Black", "Dark Brown"]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([
    "39",
    "40",
    "41",
    "42",
    "43",
    "44",
  ]);
  const [customColorInput, setCustomColorInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleAddCustomColor = () => {
    const val = customColorInput.trim();
    if (val && !selectedColors.includes(val)) {
      setSelectedColors((prev) => [...prev, val]);
      setCustomColorInput("");
    }
  };

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const refreshDashboard = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const data = await getDashboardData();
      if (data && data.stats) {
        setStatsData(data.stats);
        setProductsList(data.recentProducts || []);
        setOrdersList((prev) => {
          const fresh = data.recentOrders || [];
          if (prev.length > 0 && fresh.length > prev.length) {
            const newest = fresh[0];
            const newCode = newest?.orderCode || `#ORD-${newest?.id}`;
            showToast(`🔔 New order arrived: ${newCode} from ${newest?.customerName}!`, "success");

            // Pleasant notification chime via Web Audio API
            try {
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioCtx) {
                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                osc.start();
                osc.stop(ctx.currentTime + 0.4);
              }
            } catch {}
          }
          return fresh;
        });
        if (data.sizePresets && !isModalOpen) {
          setAdultSizesInput(data.sizePresets.rawAdult);
          setKidsSizesInput(data.sizePresets.rawKids);
        }
        setLastSyncedTime(new Date());
        if (manual) {
          showToast("Dashboard synchronized with live store data");
        }
      }
    } catch (err) {
      console.warn("Auto-sync error:", err);
      if (manual) {
        showToast("Sync error", "error");
      }
    } finally {
      if (manual) setIsRefreshing(false);
    }
  }, [isModalOpen]);

  // Background auto-refresh polling every 8s & instant re-sync on tab focus
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshDashboard(false);
      }
    }, 8000);

    const onVisibilityOrFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshDashboard(false);
      }
    };

    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
    };
  }, [refreshDashboard]);

  const handleSaveSizePresets = async () => {
    setIsSavingSizes(true);
    try {
      const res = await updateFootwearSizePresetsAction({
        adultSizes: adultSizesInput,
        kidsSizes: kidsSizesInput,
      });
      if (res.success) {
        showToast("Footwear size presets saved!");
      } else {
        showToast(res.error || "Failed to save sizes.", "error");
      }
    } catch {
      showToast("Failed to save size presets.", "error");
    } finally {
      setIsSavingSizes(false);
    }
  };

  const handleApplySizesToAll = async (target: "adults" | "kids" | "all") => {
    if (
      !confirm(
        `Apply sizes to ${target.toUpperCase()} footwear in catalog? This sets size variants on matched products.`
      )
    ) {
      return;
    }
    setIsApplyingSizes(true);
    try {
      const res = await applySizesToCategoryAction({ target });
      if (res.success) {
        showToast(`Applied sizes to ${res.count} footwear products!`);
        refreshDashboard();
      } else {
        showToast(res.error || "Failed to apply sizes.", "error");
      }
    } catch {
      showToast("Failed to apply sizes.", "error");
    } finally {
      setIsApplyingSizes(false);
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) {
      showToast("Please enter product name and price.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("category", category);
    formData.append("subCategory", subCategory.trim() || category);
    formData.append("price", price);
    formData.append("stock", stock || "10");
    formData.append("colors", JSON.stringify(selectedColors));

    const parsedPrice = Number(price) || 0;
    const defaultStock = Number(stock) || 10;
    const variants =
      selectedSizes.length > 0
        ? selectedSizes.map((sz) => ({
            label: sz,
            price: parsedPrice,
            stock: defaultStock,
          }))
        : [];
    formData.append("variants", JSON.stringify(variants));
    formData.append("colors", JSON.stringify(category === "Perfumes" ? [] : selectedColors));

    formData.append("description", description.trim() || `${name} - handcrafted quality`);
    selectedFiles.forEach((file) => {
      formData.append("imageFiles", file);
    });

    startTransition(async () => {
      const res = await addProductAction(formData);
      if (res.success) {
        setIsModalOpen(false);
        setName("");
        setPrice("");
        setDescription("");
        setSelectedFiles([]);
        setImagePreviews([]);
        showToast("Product added to catalog!");
        refreshDashboard();
        router.refresh();
      } else {
        showToast(res.error || "Failed to create product.", "error");
      }
    });
  };

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 3 - selectedFiles.length;
    if (remaining <= 0) {
      showToast("Maximum 3 pictures allowed per product.", "error");
      e.target.value = "";
      return;
    }
    const toAdd = files.slice(0, remaining);
    if (files.length > remaining) {
      showToast(`Only ${remaining} more picture(s) allowed (maximum 3 total).`, "error");
    }
    const newFiles = [...selectedFiles, ...toAdd].slice(0, 3);
    setSelectedFiles(newFiles);

    toAdd.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviews((prev) => [...prev, reader.result as string].slice(0, 3));
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const lowStockItems = productsList.filter((p) => Number(p.stock) <= 5);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Header (Clean & Minimal) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Store Overview
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mt-1">
            Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-neutral-700">Auto-Refresh</span>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-400 font-mono text-[11px]" suppressHydrationWarning>
              {lastSyncedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <button
              type="button"
              onClick={() => refreshDashboard(true)}
              disabled={isRefreshing}
              className="p-1 hover:bg-neutral-200/60 rounded-md transition text-neutral-500 hover:text-black cursor-pointer"
              title="Click to refresh dashboard now"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-black" : ""}`} />
            </button>
          </div>
          <Link
            href="/admin/manageOrders"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs sm:text-sm font-semibold rounded-xl transition"
          >
            <ReceiptText className="w-4 h-4" />
            <span>Manage Orders</span>
          </Link>
          <Link
            href="/admin/manageProducts"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs sm:text-sm font-semibold rounded-xl transition"
          >
            <Package className="w-4 h-4" />
            <span>Manage Products</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-center justify-between border shadow-xs animate-in fade-in duration-150 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-neutral-400 hover:text-neutral-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Key Metrics Stats Grid (Clean 4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="p-5 bg-white rounded-2xl border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-2">
            PKR {statsData.totalRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">All verified store sales</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Total Orders
            </span>
            <ReceiptText className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-2">
            {statsData.totalOrders}
          </p>
          <Link href="/admin/manageOrders" className="text-[11px] text-neutral-500 hover:text-black font-medium underline mt-1 block">
            View orders &rarr;
          </Link>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Catalog Items
            </span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-2">
            {statsData.totalProducts}
          </p>
          <Link href="/admin/manageProducts" className="text-[11px] text-neutral-500 hover:text-black font-medium underline mt-1 block">
            View catalog &rarr;
          </Link>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Low Stock
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-2">
            {statsData.lowStockCount}
          </p>
          <p className="text-[11px] text-amber-600 font-medium mt-1">&lt; 10 units left</p>
        </div>
      </div>

      {/* 3. Dynamic Footwear Size Master Controller */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-neutral-100 text-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Shoe Size Controller</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900">
              Footwear Size Presets (Adults &amp; Kids)
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Configure standard shoe sizes once. Save to database or sync to all footwear in catalog.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleSaveSizePresets}
              disabled={isSavingSizes}
              className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {isSavingSizes ? "Saving..." : "Save Sizes"}
            </button>
            <button
              type="button"
              onClick={() => handleApplySizesToAll("all")}
              disabled={isApplyingSizes}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {isApplyingSizes ? "Syncing..." : "Apply to All Footwear"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-neutral-800 tracking-wider">
                👞 Adult Shoe Sizes
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">Comma-separated</span>
            </div>
            <input
              type="text"
              value={adultSizesInput}
              onChange={(e) => setAdultSizesInput(e.target.value)}
              placeholder="39, 40, 41, 42, 43, 44, 45"
              className="w-full px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm font-medium text-neutral-900 focus:outline-hidden focus:border-black"
            />
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-neutral-500">
                {adultSizesInput.split(",").filter(Boolean).length} sizes
              </p>
              <button
                type="button"
                onClick={() => handleApplySizesToAll("adults")}
                disabled={isApplyingSizes}
                className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                Apply to Adult Shoes &rarr;
              </button>
            </div>
          </div>

          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-neutral-800 tracking-wider">
                🧒 Kids Shoe Sizes
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">Comma-separated</span>
            </div>
            <input
              type="text"
              value={kidsSizesInput}
              onChange={(e) => setKidsSizesInput(e.target.value)}
              placeholder="28, 29, 30, 31, 32, 33, 34, 35"
              className="w-full px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm font-medium text-neutral-900 focus:outline-hidden focus:border-black"
            />
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-neutral-500">
                {kidsSizesInput.split(",").filter(Boolean).length} sizes
              </p>
              <button
                type="button"
                onClick={() => handleApplySizesToAll("kids")}
                disabled={isApplyingSizes}
                className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                Apply to Kids Shoes &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Orders Table (Clean & Uncluttered) */}
      <section className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900">Recent Customer Orders</h2>
            <p className="text-xs text-neutral-500">Latest storefront and courier shipments</p>
          </div>
          <Link
            href="/admin/manageOrders"
            className="text-xs font-bold text-neutral-900 hover:underline inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {ordersList.length === 0 ? (
          <p className="p-8 text-center text-xs text-neutral-500">No customer orders recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-neutral-50 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Destination</th>
                  <th className="px-5 py-3">Total Amount</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {ordersList.slice(0, 6).map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50 transition">
                    <td className="px-5 py-3.5 font-bold font-mono text-neutral-900">
                      {order.orderCode || `#ORD-${order.id.toString().padStart(4, "0")}`}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-neutral-900">{order.customerName}</p>
                      <p className="text-[11px] text-neutral-400">{order.customerEmail}</p>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-600">
                      {order.city || "Pakistan"}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-neutral-900">
                      PKR {Number(order.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.status === "Delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status === "Shipped"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "Processing"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 5. Low Stock Alert Table */}
      <section className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900">Low Stock Inventory</h2>
            <p className="text-xs text-neutral-500">Products with 5 or fewer items remaining</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
            {lowStockItems.length} items
          </span>
        </div>

        {lowStockItems.length === 0 ? (
          <p className="p-8 text-center text-xs text-neutral-500">All products have healthy inventory levels.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-neutral-50 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Remaining Stock</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {lowStockItems.map((prod) => (
                  <tr key={prod.id} className="hover:bg-neutral-50 transition">
                    <td className="px-5 py-3.5 font-semibold text-neutral-900">{prod.name}</td>
                    <td className="px-5 py-3.5 text-neutral-500">{prod.category}</td>
                    <td className="px-5 py-3.5 font-bold text-amber-700">{prod.stock} left</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href="/admin/manageProducts"
                        className="text-xs font-bold text-black underline hover:text-neutral-600"
                      >
                        Restock &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: Quick Add Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900">Add New Product</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bellaro Monarch Leather Loafers"
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setCategory(newCat);
                      setSubCategory("");
                      if (newCat === "Perfumes") {
                        setSelectedSizes([]);
                        setSelectedColors([]);
                      } else {
                        setSelectedSizes([]);
                        setSelectedColors(["White", "Blue", "Brown", "Mustard", "Peach", "Black"]);
                      }
                    }}
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black font-medium"
                  >
                    <option value="Footwear">Footwear</option>
                    <option value="Perfumes">Perfumes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    Sub-Category
                  </label>
                  <input
                    type="text"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="e.g. Loafers, Moccasins"
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="4850"
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="20"
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              {/* Footwear Sizes */}
              {category === "Footwear" && (
                <div className="border border-neutral-200 rounded-2xl p-3 bg-neutral-50/70 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label className="block text-xs font-semibold uppercase text-neutral-700">
                      Shoe Sizes ({selectedSizes.length} selected)
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedSizes(["39", "40", "41", "42", "43", "44"])}
                        className="px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-neutral-200 rounded text-neutral-700 hover:text-black hover:border-black cursor-pointer"
                        title="Select adult sizes 39 to 44"
                      >
                        + 39–44
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSizes(["40", "41", "42", "43", "44", "45"])}
                        className="px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-neutral-200 rounded text-neutral-700 hover:text-black hover:border-black cursor-pointer"
                        title="Select adult sizes 40 to 45"
                      >
                        + 40–45
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSizes(["31", "32", "33", "34", "35", "36", "37", "38"])
                        }
                        className="px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-neutral-200 rounded text-neutral-700 hover:text-black hover:border-black cursor-pointer"
                        title="Select kids sizes 31 to 38"
                      >
                        + Kids (31–38)
                      </button>
                      {selectedSizes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedSizes([])}
                          className="text-[10px] text-rose-600 hover:underline cursor-pointer ml-1"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Adults Chips */}
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                      Adults (39–45):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {["39", "40", "41", "42", "43", "44", "45"].map((sz) => {
                        const isSelected = selectedSizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedSizes(selectedSizes.filter((s) => s !== sz));
                              } else {
                                setSelectedSizes([...selectedSizes, sz]);
                              }
                            }}
                            className={`w-8 h-7 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? "bg-black text-white border-black font-semibold"
                                : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Kids Chips */}
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                      Kids (31–38):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {["31", "32", "33", "34", "35", "36", "37", "38"].map((sz) => {
                        const isSelected = selectedSizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedSizes(selectedSizes.filter((s) => s !== sz));
                              } else {
                                setSelectedSizes([...selectedSizes, sz]);
                              }
                            }}
                            className={`w-8 h-7 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? "bg-black text-white border-black font-semibold"
                                : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Perfume Bottle Sizes */}
              {category === "Perfumes" && (
                <div className="border border-neutral-200 rounded-2xl p-3 bg-neutral-50/70 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label className="block text-xs font-semibold uppercase text-neutral-700">
                      Bottle Sizes ({selectedSizes.length} selected)
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedSizes(["50ml", "100ml"])}
                        className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-neutral-200 rounded text-neutral-700 hover:text-black hover:border-black cursor-pointer"
                      >
                        + 50ml &amp; 100ml
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSizes(["30ml", "50ml", "100ml", "200ml"])}
                        className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-neutral-200 rounded text-neutral-700 hover:text-black hover:border-black cursor-pointer"
                      >
                        + All Volumes
                      </button>
                      {selectedSizes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedSizes([])}
                          className="text-[10px] text-rose-600 hover:underline cursor-pointer ml-1"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {["30ml", "50ml", "100ml", "200ml"].map((sz) => {
                      const isSelected = selectedSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSizes(selectedSizes.filter((s) => s !== sz));
                            } else {
                              setSelectedSizes([...selectedSizes, sz]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? "bg-black text-white border-black font-semibold"
                              : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color Options: Only for Footwear & Non-Perfume products */}
              {category !== "Perfumes" && (
                <div className="border border-neutral-200 rounded-2xl p-3 bg-neutral-50/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase text-neutral-700">
                      Shoe / Product Colors {selectedColors.length > 0 && `(${selectedColors.length} selected)`}
                    </label>
                    {selectedColors.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedColors([])}
                        className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {FOOTWEAR_COLOR_PRESETS.map((cp) => {
                      const isSelected = selectedColors.includes(cp.name);
                      return (
                        <button
                          key={cp.name}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedColors(selectedColors.filter((c) => c !== cp.name));
                            } else {
                              setSelectedColors([...selectedColors, cp.name]);
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                            isSelected
                              ? "bg-black text-white border-black font-semibold"
                              : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full border ${
                              cp.name === "White" ? "border-neutral-300" : "border-black/20"
                            } shrink-0`}
                            style={{ backgroundColor: cp.hex }}
                          />
                          <span>{cp.name}</span>
                          {isSelected && <Check className="w-3 h-3 ml-0.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 pt-0.5">
                    <input
                      type="text"
                      value={customColorInput}
                      onChange={(e) => setCustomColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomColor();
                        }
                      }}
                      placeholder="Add custom color (e.g. Suede Tan)..."
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomColor}
                      className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Handcrafted pure leather loafers with soft cushioned insole..."
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase text-neutral-700">
                    Product Pictures (Max 3 Allowed)
                  </label>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    {selectedFiles.length} / 3 pictures
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((idx) => {
                    const preview = imagePreviews[idx];
                    const isCover = idx === 0;

                    if (preview) {
                      return (
                        <div
                          key={idx}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-2 bg-neutral-100 group ${
                            isCover ? "border-black shadow-xs ring-2 ring-black/10" : "border-neutral-200"
                          }`}
                        >
                          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                          <span
                            className={`absolute top-1 left-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shadow-xs ${
                              isCover ? "bg-black text-white" : "bg-white/90 text-neutral-700"
                            }`}
                          >
                            {isCover ? "Cover" : `Pic ${idx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="absolute top-1 right-1 p-1 bg-white/90 hover:bg-white text-rose-600 rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            title="Remove picture"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <label
                        key={idx}
                        className="relative aspect-square rounded-2xl border-2 border-dashed border-neutral-300 hover:border-black bg-neutral-50 hover:bg-neutral-100 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition"
                      >
                        <Upload className="w-4 h-4 text-neutral-400 mb-1" />
                        <span className="text-[10px] font-bold text-neutral-600">
                          {idx === 0 ? "+ Cover" : `+ Pic ${idx + 1}`}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={selectedFiles.length >= 3}
                          onChange={handleSelectFiles}
                          className="hidden"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Adding..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
