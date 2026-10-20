'use client';

import React, { useState, useEffect, useTransition, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  Package,
  Plus,
  ReceiptText,
  Search,
  Tag,
  Trash2,
  Upload,
  X,
  AlertCircle,
  TrendingUp,
  RotateCw,
} from "lucide-react";
import { Product, Order } from "@/app/db/schema";
import {
  addProductAction,
  deleteProductAction,
  updateOrderStatusAction,
  verifyPaymentAction,
  updateProductStockAction,
  DashboardStats,
  getDashboardData,
} from "@/app/lib/actions/admin";
import AdminInstallAndNotifyBar from "./AdminInstallAndNotifyBar";

interface AdminClientViewProps {
  stats: DashboardStats;
  products: Product[];
  orders: Order[];
}

export default function AdminClientView({
  stats,
  products,
  orders,
}: AdminClientViewProps) {
  const router = useRouter();
  const [ordersList, setOrdersList] = useState<Order[]>(orders);
  const [productsList, setProductsList] = useState<Product[]>(products);
  const [statsData, setStatsData] = useState<DashboardStats>(stats);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "products">("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Live auto-refresh from live database
  const refreshDashboard = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const data = await getDashboardData();
      if (data && data.stats) {
        setStatsData(data.stats);
        setProductsList(data.recentProducts || []);
        setOrdersList((prev) => {
          if (prev.length > 0 && data.recentOrders.length > prev.length) {
            const newest = data.recentOrders[0];
            const newCode = newest?.orderCode || `#ORD-${newest?.id}`;
            setStatusMessage({
              text: `🔔 New order arrived: ${newCode} from ${newest?.customerName}!`,
              type: "success",
            });
            setTimeout(() => setStatusMessage(null), 4000);

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
          return data.recentOrders || [];
        });
        setLastSyncedTime(new Date());
        if (manual) {
          setStatusMessage({ text: "Command Center synchronized with live database", type: "success" });
          setTimeout(() => setStatusMessage(null), 3000);
        }
      }
    } catch (err) {
      console.warn("Dashboard sync error:", err);
    } finally {
      if (manual) setIsRefreshing(false);
    }
  }, []);

  // Poll every 8s and trigger instant refresh on window focus
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

  // Sync with server updates
  useEffect(() => {
    setOrdersList(orders);
    setProductsList(products);
    setStatsData(stats);
  }, [orders, products, stats]);

  // Dynamic existing categories derived from current products
  const existingCategories = useMemo(() => {
    const defaultSet = new Set<string>(["Clothing", "Jewelry", "Accessories"]);
    productsList.forEach((p) => {
      if (p.category && p.category.trim()) {
        defaultSet.add(p.category.trim());
      }
    });
    return Array.from(defaultSet).sort();
  }, [productsList]);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Clothing");
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [customNewCategory, setCustomNewCategory] = useState("");
  const [subCategory, setSubCategory] = useState("T-Shirt");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      showToast("Name and price are required", "error");
      return;
    }

    const finalCategory = (isCreatingNewCategory ? customNewCategory.trim() : category.trim());
    if (!finalCategory) {
      showToast("Please enter or select a category", "error");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("category", finalCategory);
    formData.append("subCategory", subCategory.trim() || "General");
    formData.append("price", price);
    formData.append("stock", stock || "10");
    formData.append("description", description.trim());
    formData.append("image", image);
    if (selectedFile) {
      formData.append("file", selectedFile);
      formData.append("imageFile", selectedFile);
    }

    startTransition(async () => {
      const res = await addProductAction(formData);
      if (res.success) {
        setIsModalOpen(false);
        setName("");
        setCategory(existingCategories[0] || "Clothing");
        setIsCreatingNewCategory(false);
        setCustomNewCategory("");
        setPrice("");
        setStock("");
        setDescription("");
        setSelectedFile(null);
        setImagePreview(null);
        setImage("");
        showToast("Product published to catalog successfully!");
        router.refresh();
      } else {
        showToast(res.error || "Failed to add product", "error");
      }
    });
  };

  const handleDeleteProduct = (id: number, prodName: string) => {
    if (!confirm(`Are you sure you want to delete "${prodName}"?`)) return;

    setProductsList((prev) => prev.filter((p) => p.id !== id));
    startTransition(async () => {
      const res = await deleteProductAction(id);
      if (res.success) {
        showToast(`Product "${prodName}" deleted.`);
        router.refresh();
      } else {
        showToast("Failed to delete product.", "error");
        setProductsList(products);
      }
    });
  };

  const handleUpdateOrderStatus = (orderId: number, newStatus: string) => {
    // Optimistic update
    setOrdersList((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, newStatus);
      if (res.success) {
        showToast(`Order #ORD-${orderId.toString().padStart(4, "0")} marked as ${newStatus}`);
        router.refresh();
      } else {
        showToast(res.error || "Failed to update status", "error");
        setOrdersList(orders);
      }
    });
  };

  const handleVerifyPayment = (orderId: number, status: "Verified" | "Rejected") => {
    setOrdersList((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              paymentStatus: status,
              status: status === "Verified" ? "Processing" : o.status,
            }
          : o
      )
    );
    if (selectedProofOrder?.id === orderId) {
      setSelectedProofOrder(null);
    }

    startTransition(async () => {
      const res = await verifyPaymentAction(orderId, status);
      if (res.success) {
        showToast(
          status === "Verified"
            ? `Bank transfer for Order #ORD-${orderId.toString().padStart(4, "0")} approved!`
            : `Bank transfer for Order #ORD-${orderId.toString().padStart(4, "0")} rejected.`
        );
        router.refresh();
      } else {
        showToast(res.error || "Failed to update payment status.", "error");
        setOrdersList(orders);
      }
    });
  };

  const handleQuickRestock = (product: Product, delta: number) => {
    const current = Number(product.stock) || 0;
    const newStock = Math.max(0, current + delta);

    setProductsList((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: newStock.toString() } : p))
    );

    startTransition(async () => {
      const res = await updateProductStockAction(product.id, newStock);
      if (res.success) {
        showToast(`Restocked ${product.name} to ${newStock} units.`);
        router.refresh();
      } else {
        showToast("Failed to restock product", "error");
        setProductsList(products);
      }
    });
  };

  // Pending bank payments needing verification
  const pendingVerifications = ordersList.filter(
    (o) => o.paymentMethod === "bank_transfer" && o.paymentStatus === "Pending"
  );

  const filteredOrders = ordersList.filter((o) => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;
    const formattedId = `#ORD-${o.id.toString().padStart(4, "0")}`.toLowerCase();
    return (
      formattedId.includes(query) ||
      o.id.toString() === query ||
      (o.orderCode && o.orderCode.toLowerCase().includes(query)) ||
      o.customerName.toLowerCase().includes(query) ||
      o.customerEmail.toLowerCase().includes(query) ||
      o.status.toLowerCase().includes(query)
    );
  });

  const filteredProducts = productsList.filter((p) => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Store Command Center
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-neutral-500">
            <span>Real-time analytics, inventory management, and instant order fulfillment.</span>
            <span className="hidden sm:inline text-neutral-300">•</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold">Live Auto-Sync</span>
              <span className="text-emerald-400">•</span>
              <span className="font-mono text-[11px] text-emerald-700" suppressHydrationWarning>
                {lastSyncedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <button
                type="button"
                onClick={() => refreshDashboard(true)}
                disabled={isRefreshing}
                className="ml-0.5 p-0.5 hover:bg-emerald-100 rounded transition text-emerald-800 cursor-pointer"
                title="Refresh Live Data"
              >
                <RotateCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/manageOrders"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-sm font-semibold rounded-xl transition"
          >
            <ReceiptText className="w-4 h-4 text-neutral-600" />
            <span>Manage All Orders</span>
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Admin Mobile Install & Web Push Notification Quick Setup */}
      <AdminInstallAndNotifyBar />

      {/* Toast Feedback */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-sm flex items-center justify-between border shadow-sm transition animate-fade-in ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-neutral-400 hover:text-neutral-800 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Urgent Bank Transfer Approval Alert */}
      {pendingVerifications.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {pendingVerifications.length}
            </span>
            <div>
              <p className="font-bold text-sm text-neutral-900">
                Action Required: {pendingVerifications.length} Bank Transfer {pendingVerifications.length === 1 ? "Receipt" : "Receipts"} Awaiting Approval
              </p>
              <p className="text-xs text-neutral-600">
                Customers have placed bank transfer orders. Review screenshots to advance them to Processing.
              </p>
            </div>
          </div>
          <Link
            href="/admin/manageOrders"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-xs transition self-start sm:self-auto shrink-0"
          >
            Review in Orders Console
          </Link>
        </div>
      )}

      {/* 4 Metric Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Total Revenue
            </p>
            <p className="text-2xl font-bold text-neutral-900 mt-0.5">
              PKR {statsData.totalRevenue.toLocaleString()}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium">Recorded Sales</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ReceiptText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Total Orders
            </p>
            <p className="text-2xl font-bold text-neutral-900 mt-0.5">
              {statsData.totalOrders}
            </p>
            <Link href="/admin/manageOrders" className="text-[11px] text-neutral-500 hover:text-black font-medium underline">
              View All Orders &rarr;
            </Link>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Active Products
            </p>
            <p className="text-2xl font-bold text-neutral-900 mt-0.5">
              {statsData.totalProducts}
            </p>
            <Link href="/admin/manageProducts" className="text-[11px] text-neutral-500 hover:text-black font-medium underline">
              Manage Catalog &rarr;
            </Link>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Low Stock Alert
            </p>
            <p className="text-2xl font-bold text-neutral-900 mt-0.5">
              {statsData.lowStockCount}
            </p>
            <span className="text-[11px] text-amber-600 font-medium">&lt; 10 units left</span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/manageOrders"
          className="p-4 bg-white rounded-2xl border border-neutral-200 hover:border-black/30 shadow-xs transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-neutral-900">Manage Orders Console</p>
              <p className="text-xs text-neutral-500">Full shipping addresses, slips & invoices</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition" />
        </Link>

        <Link
          href="/admin/manageProducts"
          className="p-4 bg-white rounded-2xl border border-neutral-200 hover:border-black/30 shadow-xs transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-neutral-900">Manage Catalog & Inventory</p>
              <p className="text-xs text-neutral-500">Edit titles, prices, stock & photos</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition" />
        </Link>

        <Link
          href="/admin/pricing"
          className="p-4 bg-white rounded-2xl border border-neutral-200 hover:border-black/30 shadow-xs transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-neutral-900">Pricing & Discount Rules</p>
              <p className="text-xs text-neutral-500">Create promo codes & spend rules</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition" />
        </Link>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === "orders"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Recent Orders ({ordersList.length})
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === "products"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Recent Products ({productsList.length})
            </button>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black"
            />
          </div>
        </div>

        {/* Tab 1: Recent Orders */}
        {activeTab === "orders" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500 font-semibold border-y border-neutral-100 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Bank Slip Verification</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500">
                      <ReceiptText className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                      <p>No orders found matching search criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const isBankTransfer = o.paymentMethod === "bank_transfer";
                    const isVerified = o.paymentStatus === "Verified";
                    const isRejected = o.paymentStatus === "Rejected";

                    return (
                      <tr key={o.id} className="hover:bg-neutral-50/60 transition">
                        <td className="py-3 px-4 font-mono">
                          <p className="font-bold text-neutral-800">#ORD-{o.id.toString().padStart(4, "0")}</p>
                          {o.orderCode && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                              {o.orderCode}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-neutral-900">{o.customerName}</p>
                          <p className="text-xs text-neutral-400 truncate max-w-[200px]">{o.customerEmail}</p>
                          {o.phone && <p className="text-[11px] text-neutral-500 font-mono">{o.phone}</p>}
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-neutral-900">
                            PKR {Number(o.totalAmount).toLocaleString()}
                          </p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isBankTransfer
                                ? "bg-purple-100 text-purple-900 border border-purple-200"
                                : "bg-neutral-100 text-neutral-700"
                            }`}
                          >
                            {isBankTransfer ? "Bank Transfer" : "COD"}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {isBankTransfer ? (
                            <div className="space-y-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  isVerified
                                    ? "bg-emerald-100 text-emerald-800"
                                    : isRejected
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800 animate-pulse"
                                }`}
                              >
                                {isVerified ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Verified</span>
                                  </>
                                ) : isRejected ? (
                                  <>
                                    <Ban className="w-3 h-3 text-rose-600" />
                                    <span>Rejected</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>Needs Proof</span>
                                  </>
                                )}
                              </span>

                              <div className="flex items-center gap-1.5 pt-0.5">
                                {o.paymentProof && (
                                  <button
                                    onClick={() => setSelectedProofOrder(o)}
                                    className="p-1 text-neutral-500 hover:text-black rounded cursor-pointer"
                                    title="View Bank Slip"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {!isVerified && (
                                  <button
                                    onClick={() => handleVerifyPayment(o.id, "Verified")}
                                    disabled={isPending}
                                    className="px-2 py-0.8 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-md transition cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-400">Collect on delivery</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className={`text-xs font-semibold py-1 px-2.5 rounded-lg border transition cursor-pointer ${
                              o.status === "Delivered"
                                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                                : o.status === "Shipped"
                                ? "bg-indigo-50 text-indigo-900 border-indigo-200"
                                : o.status === "Processing"
                                ? "bg-blue-50 text-blue-900 border-blue-200"
                                : o.status === "Cancelled"
                                ? "bg-rose-50 text-rose-900 border-rose-200"
                                : "bg-amber-50 text-amber-900 border-amber-200"
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Link
                            href="/admin/manageOrders"
                            className="text-xs font-semibold text-neutral-600 hover:text-black underline"
                          >
                            Full Invoice
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <div className="pt-3 text-right">
              <Link
                href="/admin/manageOrders"
                className="text-xs font-bold text-neutral-900 hover:underline inline-flex items-center gap-1"
              >
                <span>Go to Dedicated Orders Manager Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Tab 2: Recent Products */}
        {activeTab === "products" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500 font-semibold border-y border-neutral-100 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock & Restock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-neutral-500">
                      <Package className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                      <p>No products match your search.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const stockNum = Number(p.stock) || 0;
                    const isLowStock = stockNum < 10;
                    return (
                      <tr key={p.id} className="hover:bg-neutral-50/60 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                              <Image
                                src={p.image || "/images/img1.jpg"}
                                alt={p.name}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-900">{p.name}</p>
                              <p className="text-xs text-neutral-400">{p.subCategory || "General"}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800">
                            {p.category}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-bold text-neutral-900">
                          PKR {Number(p.price).toLocaleString()}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.8 rounded-full text-xs font-semibold ${
                                isLowStock
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isLowStock ? "bg-amber-600" : "bg-emerald-600"
                                }`}
                              />
                              {stockNum} in stock
                            </span>

                            {isLowStock && (
                              <button
                                onClick={() => handleQuickRestock(p, 10)}
                                disabled={isPending}
                                className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-bold rounded-md transition cursor-pointer"
                                title="Quick restock +10"
                              >
                                +10 Restock
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href="/admin/manageProducts"
                              className="text-xs font-semibold text-neutral-600 hover:text-black underline"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              disabled={isPending}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <div className="pt-3 text-right">
              <Link
                href="/admin/manageProducts"
                className="text-xs font-bold text-neutral-900 hover:underline inline-flex items-center gap-1"
              >
                <span>Go to Dedicated Catalog & Inventory Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h2 className="text-xl font-bold text-neutral-900">Add New Product</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Heavyweight Acid Wash Boxy Tee"
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase text-neutral-700">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !isCreatingNewCategory;
                        setIsCreatingNewCategory(nextState);
                        if (nextState) {
                          setCustomNewCategory("");
                        } else {
                          setCategory(existingCategories[0] || "Clothing");
                        }
                      }}
                      className="text-[11px] font-semibold text-neutral-800 hover:text-black hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {isCreatingNewCategory ? (
                        <span>Choose existing</span>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>+ New Category</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isCreatingNewCategory ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        value={customNewCategory}
                        onChange={(e) => {
                          setCustomNewCategory(e.target.value);
                          setCategory(e.target.value);
                        }}
                        placeholder="Type new category (e.g. Footwear, Hoodies)..."
                        className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black font-medium"
                        autoFocus
                      />
                      <p className="text-[10px] text-neutral-400">
                        Will be created and available storewide
                      </p>
                    </div>
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === "__create_new__") {
                          setIsCreatingNewCategory(true);
                          setCustomNewCategory("");
                          setCategory("");
                        } else {
                          setCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black cursor-pointer"
                    >
                      {existingCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__create_new__">+ Create New Category...</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    Sub-Category
                  </label>
                  <input
                    type="text"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="e.g. Graphic Tees"
                    className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="50"
                    className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black font-semibold"
                  />
                </div>
              </div>

              {/* Cloudinary Image Input */}
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  Product Image (Cloudinary)
                </label>

                {imagePreview || (image && image.trim() !== "" && !image.startsWith("data:")) ? (
                  <div className="relative mb-2.5 flex items-center gap-3 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white shrink-0 border border-neutral-200">
                      <Image
                        src={imagePreview || image}
                        alt="Preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-neutral-800 truncate">
                        {selectedFile ? selectedFile.name : image}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium">Ready to upload to Cloudinary</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview(null);
                        setImage("");
                      }}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded-lg transition"
                      title="Reset image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl cursor-pointer transition border border-dashed border-neutral-300">
                    <Upload className="w-4 h-4 text-neutral-500" />
                    <span>Upload Image from Device (Cloudinary)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    value={image.startsWith("data:") ? "" : image}
                    onChange={(e) => {
                      setImage(e.target.value);
                      setImagePreview(null);
                      setSelectedFile(null);
                    }}
                    placeholder="Or enter direct image URL / Cloudinary URL"
                    className="w-full px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter product details, fabric, and sizing..."
                  className="w-full px-3.5 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-semibold bg-black hover:bg-neutral-800 text-white rounded-xl shadow-xs transition"
                >
                  {isPending ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Screenshot Proof Modal */}
      {selectedProofOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  Bank Transfer Screenshot
                </h3>
                <p className="text-xs text-neutral-500 font-mono">
                  Order #ORD-{selectedProofOrder.id.toString().padStart(4, "0")}
                </p>
              </div>

              <button
                onClick={() => setSelectedProofOrder(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-2xl text-xs">
              <div>
                <span className="text-neutral-400 font-medium block">Customer</span>
                <span className="font-semibold text-neutral-900">{selectedProofOrder.customerName}</span>
                <span className="text-neutral-500 block truncate">{selectedProofOrder.customerEmail}</span>
              </div>
              <div className="text-right">
                <span className="text-neutral-400 font-medium block">Transferred Amount</span>
                <span className="font-bold text-base text-neutral-900">
                  PKR {Number(selectedProofOrder.totalAmount).toLocaleString()}
                </span>
                <span className="text-neutral-500 block">{selectedProofOrder.paymentStatus}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">
                Submitted Screenshot Receipt
              </span>
              <div className="relative w-full aspect-4/5 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200 flex items-center justify-center">
                {selectedProofOrder.paymentProof ? (
                  <Image
                    src={selectedProofOrder.paymentProof}
                    alt="Payment receipt proof"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                ) : (
                  <div className="text-neutral-400 text-sm">No screenshot provided</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => handleVerifyPayment(selectedProofOrder.id, "Rejected")}
                disabled={isPending}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Reject Payment
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProofOrder(null)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-xl transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyPayment(selectedProofOrder.id, "Verified")}
                  disabled={isPending}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                >
                  {isPending ? "Updating..." : "Approve & Mark Verified"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
