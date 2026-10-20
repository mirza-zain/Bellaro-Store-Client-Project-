'use client';

import React, { useState, useEffect, useTransition, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Eye,
  FileText,
  Filter,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  Search,
  Printer,
  Trash2,
  Truck,
  User,
  X,
  ExternalLink,
  RotateCw,
} from "lucide-react";
import { Order } from "@/app/db/schema";
import {
  updateOrderStatusAction,
  verifyPaymentAction,
  deleteOrderAction,
  getAllOrdersAction,
} from "@/app/lib/actions/admin";

interface OrdersManagerProps {
  initialOrders: Order[];
}

export default function OrdersManager({ initialOrders }: OrdersManagerProps) {
  const router = useRouter();
  const [ordersList, setOrdersList] = useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modals state
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);
  const [selectedDetailsOrder, setSelectedDetailsOrder] = useState<Order | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(new Date());

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Live auto-refresh from live database
  const refreshOrders = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const freshOrders = await getAllOrdersAction();
      if (Array.isArray(freshOrders)) {
        setOrdersList((prev) => {
          // Detect newly arrived order
          if (prev.length > 0 && freshOrders.length > prev.length) {
            const newest = freshOrders[0];
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
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                osc.start();
                osc.stop(ctx.currentTime + 0.4);
              }
            } catch {}
          }
          return freshOrders;
        });
        setLastSyncedTime(new Date());
        if (manual) {
          showToast("Orders synchronized with live database", "success");
        }
      }
    } catch (err) {
      console.warn("Auto-sync error:", err);
    } finally {
      if (manual) setIsRefreshing(false);
    }
  }, []);

  // Poll every 8s and trigger instant refresh on window focus
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshOrders(false);
      }
    }, 8000);

    const onVisibilityOrFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshOrders(false);
      }
    };

    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
    };
  }, [refreshOrders]);

  // Synchronize when server revalidates
  useEffect(() => {
    setOrdersList(initialOrders);
  }, [initialOrders]);

  // Clean, isolated 1-page printable invoice generator
  const printInvoiceDocument = (order: Order) => {
    const items = order.items || [];
    const itemsSubtotal = items.reduce(
      (sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );
    const discount = Number(order.discountAmount) || 0;
    const totalAmount = Number(order.totalAmount) || 0;
    const calculatedShipping = Math.max(0, totalAmount - (itemsSubtotal - discount));
    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString("en-PK", { dateStyle: "long" })
      : "Recent";

    const itemsRows = items
      .map((it: any) => {
        const lineTotal = (Number(it.price) || 0) * (Number(it.quantity) || 1);
        return `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111;">
            ${it.name || "Product"}
          </td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
            ${it.variant ? `<span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${it.variant}</span>` : "Standard"}
          </td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 700; color: #111;">
            ${it.quantity}
          </td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">
            PKR ${Number(it.price).toLocaleString()}
          </td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 700; color: #111;">
            PKR ${lineTotal.toLocaleString()}
          </td>
        </tr>
      `;
      })
      .join("");

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice #ORD-${order.id.toString().padStart(4, "0")} - ${order.orderCode || ""} | BELLARO</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 14mm;
            }
            *, *:before, *:after { box-sizing: border-box; margin: 0; padding: 0; }
            html, body {
              background: #fff;
              color: #111;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              font-size: 12.5px;
              line-height: 1.35;
            }
            .invoice-card {
              max-width: 720px;
              margin: 0 auto;
              padding: 6px 0;
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }
            .brand-title {
              font-size: 24px;
              font-weight: 900;
              letter-spacing: -0.5px;
            }
            .brand-sub {
              font-size: 11px;
              color: #4b5563;
              margin-top: 1px;
            }
            .order-meta {
              text-align: right;
            }
            .order-id {
              font-family: monospace;
              font-size: 18px;
              font-weight: 800;
              color: #000;
            }
            .tracking-badge {
              display: inline-block;
              font-family: monospace;
              font-size: 11px;
              font-weight: 700;
              background: #f3f4f6;
              border: 1px solid #d1d5db;
              padding: 2px 8px;
              border-radius: 4px;
              margin-top: 3px;
            }
            .order-date {
              font-size: 11px;
              color: #6b7280;
              margin-top: 3px;
            }
            .customer-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 12px 14px;
              margin-bottom: 14px;
            }
            .field-label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b7280;
              margin-bottom: 3px;
            }
            .field-name {
              font-size: 13px;
              font-weight: 700;
              color: #111;
              margin-bottom: 2px;
            }
            .field-text {
              font-size: 12px;
              color: #4b5563;
            }
            .section-label {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #4b5563;
              margin-bottom: 6px;
            }
            .table-wrap {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
              margin-bottom: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th {
              background: #f3f4f6;
              padding: 7px 10px;
              text-align: left;
              font-size: 10px;
              text-transform: uppercase;
              color: #4b5563;
              border-bottom: 1px solid #e5e7eb;
            }
            .summary-card {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 12px 14px;
              margin-bottom: 16px;
            }
            .summary-line {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #4b5563;
              margin-bottom: 5px;
            }
            .grand-total-line {
              display: flex;
              justify-content: space-between;
              border-top: 1px solid #d1d5db;
              padding-top: 8px;
              margin-top: 6px;
              font-size: 15px;
              font-weight: 800;
              color: #000;
            }
            .footer-card {
              text-align: center;
              border-top: 1px solid #e5e7eb;
              padding-top: 10px;
              font-size: 11px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="invoice-card">
            <div class="header-bar">
              <div style="display: flex; align-items: center; gap: 12px;">
                <img src="/images/logo.png" alt="Bellaro" style="height: 46px; width: auto; object-fit: contain;" />
                <div>
                  <div class="brand-title">BELLARO</div>
                  <div class="brand-sub">Store Fulfillment & Official Tax Invoice</div>
                  <div class="brand-sub">Helpline: +92 339 4015589 • Karachi, Pakistan</div>
                </div>
              </div>
              <div class="order-meta">
                <div class="order-id">#ORD-${order.id.toString().padStart(4, "0")}</div>
                ${order.orderCode ? `<div class="tracking-badge">Tracking Code: ${order.orderCode}</div>` : ""}
                <div class="order-date">${orderDate}</div>
              </div>
            </div>

            <div class="customer-grid">
              <div>
                <div class="field-label">Customer Contact</div>
                <div class="field-name">${order.customerName}</div>
                <div class="field-text">${order.customerEmail}</div>
                ${order.phone ? `<div class="field-text" style="font-family: monospace; margin-top: 2px;">Phone: ${order.phone}</div>` : ""}
              </div>
              <div>
                <div class="field-label">Shipping Address</div>
                <div class="field-name">${[order.city, order.country].filter(Boolean).join(", ") || "Pakistan"}</div>
                <div class="field-text">${order.address || "Standard Delivery"}</div>
              </div>
            </div>

            <div class="section-label">Order Items (${items.length})</div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style="width: 44%;">Item</th>
                    <th>Variant</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>
            </div>

            <div class="summary-card">
              <div class="summary-line">
                <span>Payment Method:</span>
                <span style="font-weight: 700; text-transform: uppercase; color: #111;">
                  ${order.paymentMethod === "bank_transfer" ? "Bank Transfer" : "Cash on Delivery"}
                </span>
              </div>
              <div class="summary-line">
                <span>Items Subtotal:</span>
                <span style="font-weight: 600; color: #111;">PKR ${itemsSubtotal.toLocaleString()}</span>
              </div>
              ${order.discountCode ? `
                <div class="summary-line" style="color: #047857;">
                  <span>Coupon Applied (${order.discountCode}):</span>
                  <span>-PKR ${discount.toLocaleString()}</span>
                </div>
              ` : ""}
              <div class="summary-line">
                <span>Shipping:</span>
                <span style="font-weight: 600; color: ${calculatedShipping > 0 ? "#111" : "#047857"};">
                  ${calculatedShipping > 0 ? `PKR ${calculatedShipping.toLocaleString()}` : "FREE"}
                </span>
              </div>
              <div class="grand-total-line">
                <span>Grand Total:</span>
                <span>PKR ${totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div class="footer-card">
              <p style="font-weight: 700; color: #111;">Thank you for shopping with Bellaro</p>
              <p style="margin-top: 2px;">Karachi, Pakistan • Helpline: +92 339 4015589 • www.bellaro.pk</p>
              <p style="font-size: 10px; color: #9ca3af; margin-top: 4px;">This is a computer generated official invoice and packing slip.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Direct isolated iframe printing for 100% 1-page accuracy
    let iframe = document.getElementById("bellaro-print-iframe") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "bellaro-print-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(invoiceHtml);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 200);
    }
  };

  // Status updates
  const handleUpdateStatus = (orderId: number, newStatus: string) => {
    // Optimistic update
    setOrdersList((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selectedDetailsOrder && selectedDetailsOrder.id === orderId) {
      setSelectedDetailsOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, newStatus);
      if (res.success) {
        showToast(`Order #ORD-${orderId.toString().padStart(4, "0")} marked as ${newStatus}`);
        router.refresh();
      } else {
        showToast(res.error || "Failed to update order status", "error");
        // Revert on failure
        setOrdersList(initialOrders);
      }
    });
  };

  // Payment Verification updates
  const handleVerifyPayment = (orderId: number, paymentStatus: "Verified" | "Rejected") => {
    // Optimistic update
    setOrdersList((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            paymentStatus,
            status: paymentStatus === "Verified" ? "Processing" : o.status,
          };
        }
        return o;
      })
    );
    if (selectedProofOrder && selectedProofOrder.id === orderId) {
      setSelectedProofOrder(null);
    }
    if (selectedDetailsOrder && selectedDetailsOrder.id === orderId) {
      setSelectedDetailsOrder((prev) =>
        prev
          ? {
              ...prev,
              paymentStatus,
              status: paymentStatus === "Verified" ? "Processing" : prev.status,
            }
          : null
      );
    }

    startTransition(async () => {
      const res = await verifyPaymentAction(orderId, paymentStatus);
      if (res.success) {
        showToast(
          paymentStatus === "Verified"
            ? `Bank transfer for Order #ORD-${orderId.toString().padStart(4, "0")} approved!`
            : `Bank transfer for Order #ORD-${orderId.toString().padStart(4, "0")} rejected.`
        );
        router.refresh();
      } else {
        showToast(res.error || "Failed to update payment status", "error");
        setOrdersList(initialOrders);
      }
    });
  };

  // Delete Order
  const handleDeleteOrder = (orderId: number) => {
    if (!confirm(`Are you sure you want to permanently delete Order #ORD-${orderId.toString().padStart(4, "0")}?`)) {
      return;
    }

    // Optimistic deletion
    setOrdersList((prev) => prev.filter((o) => o.id !== orderId));
    if (selectedDetailsOrder?.id === orderId) setSelectedDetailsOrder(null);

    startTransition(async () => {
      const res = await deleteOrderAction(orderId);
      if (res.success) {
        showToast(`Order #ORD-${orderId.toString().padStart(4, "0")} deleted.`);
        router.refresh();
      } else {
        showToast(res.error || "Failed to delete order", "error");
        setOrdersList(initialOrders);
      }
    });
  };

  // Calculations for quick metrics
  const totalRevenue = ordersList.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const pendingOrdersCount = ordersList.filter((o) => o.status === "Pending").length;
  const processingCount = ordersList.filter((o) => o.status === "Processing").length;
  const deliveredCount = ordersList.filter((o) => o.status === "Delivered").length;
  const awaitingVerificationCount = ordersList.filter(
    (o) => o.paymentMethod === "bank_transfer" && o.paymentStatus === "Pending"
  ).length;

  // Filtering
  const filteredOrders = ordersList.filter((o) => {
    const formattedId = `#ORD-${o.id.toString().padStart(4, "0")}`.toLowerCase();
    const query = searchTerm.toLowerCase().trim();

    const matchesSearch =
      query === "" ||
      formattedId.includes(query) ||
      o.id.toString() === query ||
      (o.orderCode && o.orderCode.toLowerCase().includes(query)) ||
      o.customerName.toLowerCase().includes(query) ||
      o.customerEmail.toLowerCase().includes(query) ||
      (o.phone && o.phone.toLowerCase().includes(query)) ||
      (o.city && o.city.toLowerCase().includes(query)) ||
      (o.country && o.country.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "needs_verification"
        ? o.paymentMethod === "bank_transfer" && o.paymentStatus === "Pending"
        : o.status.toLowerCase() === statusFilter.toLowerCase());

    const matchesPayment =
      paymentFilter === "all" ||
      o.paymentMethod.toLowerCase() === paymentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div className="space-y-6">
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
          <button
            onClick={() => setStatusMessage(null)}
            className="text-neutral-400 hover:text-neutral-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action alert banner if bank payments require verification */}
      {awaitingVerificationCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
              {awaitingVerificationCount}
            </span>
            <div>
              <p className="font-semibold text-sm text-neutral-900">
                Action Required: {awaitingVerificationCount} Bank Transfer {awaitingVerificationCount === 1 ? "Receipt" : "Receipts"} Pending Verification
              </p>
              <p className="text-xs text-neutral-600">
                Customers have uploaded payment transfer screenshots awaiting your confirmation.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setStatusFilter("needs_verification");
              setPaymentFilter("all");
            }}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            Filter Pending Approvals
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">Total Orders</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{ordersList.length}</p>
          <span className="text-[11px] text-neutral-500">All recorded orders</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-amber-600 tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{pendingOrdersCount}</p>
          <span className="text-[11px] text-neutral-500">Awaiting shipment</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-blue-600 tracking-wider">In Processing</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{processingCount}</p>
          <span className="text-[11px] text-neutral-500">Packed / In transit</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-emerald-600 tracking-wider">Delivered</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{deliveredCount}</p>
          <span className="text-[11px] text-neutral-500">Fulfilled successfully</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">Total Revenue</p>
          <p className="text-xl font-bold text-neutral-900 mt-1 truncate">
            PKR {totalRevenue.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">Live Gross Total</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Quick Status Filter Tabs & Live Auto-Sync Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: "all", label: "All Orders", count: ordersList.length },
              { id: "Pending", label: "Pending", count: pendingOrdersCount },
              { id: "Processing", label: "Processing", count: processingCount },
              { id: "Shipped", label: "Shipped", count: ordersList.filter((o) => o.status === "Shipped").length },
              { id: "Delivered", label: "Delivered", count: deliveredCount },
              { id: "Cancelled", label: "Cancelled", count: ordersList.filter((o) => o.status === "Cancelled").length },
              {
                id: "needs_verification",
                label: "Needs Proof Approval",
                count: awaitingVerificationCount,
                highlight: awaitingVerificationCount > 0,
              },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? "bg-black text-white shadow-xs"
                      : tab.highlight
                      ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                      : "bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? "bg-neutral-800 text-neutral-200"
                        : "bg-neutral-200 text-neutral-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs shrink-0 self-end sm:self-auto pt-1 sm:pt-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-neutral-600">Auto-Sync</span>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-400 font-mono text-[11px]" suppressHydrationWarning>
              {lastSyncedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <button
              type="button"
              onClick={() => refreshOrders(true)}
              disabled={isRefreshing}
              className="p-1 hover:bg-neutral-100 rounded-md transition text-neutral-500 hover:text-black cursor-pointer"
              title="Click to force refresh orders now"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-black" : ""}`} />
            </button>
          </div>
        </div>

        {/* Search & Secondary Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order #, customer name, email, phone, city, or country..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-700 focus:outline-hidden focus:border-black w-full sm:w-auto"
            >
              <option value="all">All Payment Methods</option>
              <option value="cod">Cash on Delivery (COD)</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>

            {(searchTerm || statusFilter !== "all" || paymentFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPaymentFilter("all");
                }}
                className="px-3 py-2 text-xs text-neutral-500 hover:text-black font-semibold whitespace-nowrap cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto rounded-xl border border-neutral-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer & Destination</th>
                <th className="py-3 px-4">Purchased Items</th>
                <th className="py-3 px-4">Payment & Verification</th>
                <th className="py-3 px-4">Fulfillment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-neutral-500">
                    <ReceiptText className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                    <p className="font-medium text-neutral-700">No orders match the current criteria.</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Try searching with another keyword or resetting filters.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const isBankTransfer = o.paymentMethod === "bank_transfer";
                  const isVerified = o.paymentStatus === "Verified";
                  const isRejected = o.paymentStatus === "Rejected";
                  const dateStr = o.createdAt
                    ? new Date(o.createdAt).toLocaleDateString("en-PK", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recently";

                  return (
                    <tr key={o.id} className="hover:bg-neutral-50/70 transition">
                      {/* Order ID & Tracking Code & Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedDetailsOrder(o)}
                            className="font-mono font-bold text-neutral-900 hover:text-black hover:underline cursor-pointer"
                            title="Click to view full order invoice"
                          >
                            <span>#ORD-{o.id.toString().padStart(4, "0")}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const code = o.orderCode || `#ORD-${o.id.toString().padStart(4, "0")}`;
                              navigator.clipboard.writeText(code);
                              showToast(`Copied ${code} to clipboard`);
                            }}
                            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition cursor-pointer"
                            title="Copy Order Tracking Code"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        {o.orderCode && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                              {o.orderCode}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-neutral-400 mt-0.5" suppressHydrationWarning>{dateStr}</p>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-neutral-900">{o.customerName}</p>
                        <p className="text-xs text-neutral-500 truncate max-w-[200px]" title={o.customerEmail}>
                          {o.customerEmail}
                        </p>
                        {o.phone && (
                          <div className="flex items-center gap-1 text-xs text-neutral-600 font-mono mt-0.5">
                            <Phone className="w-3 h-3 text-neutral-400" />
                            <a href={`tel:${o.phone}`} className="hover:underline">{o.phone}</a>
                          </div>
                        )}
                        {(o.city || o.country) && (
                          <p
                            className="text-xs text-neutral-400 truncate max-w-[220px] mt-0.5"
                            title={o.address ? `${o.address}, ${[o.city, o.country].filter(Boolean).join(", ")}` : [o.city, o.country].filter(Boolean).join(", ")}
                          >
                            📍 {[o.city, o.country].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </td>

                      {/* Purchased Items Preview */}
                      <td className="py-3.5 px-4">
                        {o.items && o.items.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1 max-w-[260px]">
                              {o.items.slice(0, 3).map((it: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-block text-[11px] bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-lg border border-neutral-200 truncate max-w-[220px]"
                                  title={`${it.name} (Qty: ${it.quantity}${it.variant ? `, ${it.variant}` : ""})`}
                                >
                                  <strong className="font-semibold">{it.quantity}x</strong> {it.name}
                                  {it.variant && ` [${it.variant}]`}
                                </span>
                              ))}
                            </div>
                            {o.items.length > 3 && (
                              <button
                                onClick={() => setSelectedDetailsOrder(o)}
                                className="text-[11px] text-neutral-500 hover:text-black font-semibold underline cursor-pointer"
                              >
                                +{o.items.length - 3} more items
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400 italic">No items listed</span>
                        )}
                      </td>

                      {/* Payment & Verification */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-neutral-900 text-sm">
                          PKR {Number(o.totalAmount).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isBankTransfer
                                ? "bg-purple-100 text-purple-900 border border-purple-200"
                                : "bg-neutral-100 text-neutral-700"
                            }`}
                          >
                            {isBankTransfer ? "Bank Transfer" : "COD"}
                          </span>
                          {o.discountCode && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                              {o.discountCode}
                            </span>
                          )}
                        </div>

                        {/* Bank Transfer Approval Controls */}
                        {isBankTransfer && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-1">
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

                              {o.paymentProof && (
                                <button
                                  onClick={() => setSelectedProofOrder(o)}
                                  className="p-1 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-md transition cursor-pointer"
                                  title="View screenshot receipt"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Quick Action Buttons */}
                            {!isVerified && (
                              <div className="flex items-center gap-1 pt-1">
                                <button
                                  onClick={() => handleVerifyPayment(o.id, "Verified")}
                                  disabled={isPending}
                                  className="px-2 py-0.8 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-md transition shadow-2xs cursor-pointer"
                                  title="Approve payment & advance order"
                                >
                                  Approve
                                </button>
                                {!isRejected && (
                                  <button
                                    onClick={() => handleVerifyPayment(o.id, "Rejected")}
                                    disabled={isPending}
                                    className="px-2 py-0.8 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-md transition cursor-pointer"
                                    title="Reject payment"
                                  >
                                    Reject
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Fulfillment Status Selector */}
                      <td className="py-3.5 px-4">
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                          className={`text-xs font-semibold py-1.5 px-3 rounded-xl border transition cursor-pointer ${
                            o.status === "Delivered"
                              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                              : o.status === "Shipped"
                              ? "bg-indigo-50 text-indigo-900 border-indigo-300"
                              : o.status === "Processing"
                              ? "bg-blue-50 text-blue-900 border-blue-300"
                              : o.status === "Cancelled"
                              ? "bg-rose-50 text-rose-900 border-rose-300"
                              : "bg-amber-50 text-amber-900 border-amber-300"
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDetailsOrder(o)}
                            className="p-2 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-xl transition cursor-pointer"
                            title="View Full Order Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => printInvoiceDocument(o)}
                            className="p-2 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-xl transition cursor-pointer"
                            title="Print Invoice / Packing Slip"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(o.id)}
                            disabled={isPending}
                            className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Delete Order Record"
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
        </div>
      </div>

      {/* MODAL 1: Full Order Details & Invoice Modal */}
      {selectedDetailsOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-neutral-200 max-h-[92vh] overflow-y-auto space-y-5">
            {/* Modal Screen Header */}
            <div className="flex items-start justify-between pb-4 border-b border-neutral-100">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">Order Invoice & Packing Slip</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-2xl font-bold text-neutral-900 font-mono">
                    #ORD-{selectedDetailsOrder.id.toString().padStart(4, "0")}
                  </h3>
                  {selectedDetailsOrder.orderCode && (
                    <span className="px-2 py-0.5 text-xs font-mono font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-md">
                      {selectedDetailsOrder.orderCode}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const code = selectedDetailsOrder.orderCode || `#ORD-${selectedDetailsOrder.id.toString().padStart(4, "0")}`;
                      navigator.clipboard.writeText(code);
                      showToast(`Copied ${code} to clipboard`);
                    }}
                    className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition cursor-pointer"
                    title="Copy Tracking Code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-neutral-400" suppressHydrationWarning>
                  Placed on {selectedDetailsOrder.createdAt ? new Date(selectedDetailsOrder.createdAt).toLocaleString("en-PK") : "Recent"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printInvoiceDocument(selectedDetailsOrder)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                  title="Print Packing Slip / Invoice"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button
                  onClick={() => setSelectedDetailsOrder(null)}
                  className="p-2 text-neutral-400 hover:text-neutral-900 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-neutral-500 uppercase tracking-wider block">Customer Contact</span>
                <p className="text-sm font-bold text-neutral-900">{selectedDetailsOrder.customerName}</p>
                <p className="text-neutral-600">{selectedDetailsOrder.customerEmail}</p>
                {selectedDetailsOrder.phone && (
                  <p className="font-mono text-neutral-700">Phone: {selectedDetailsOrder.phone}</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-neutral-500 uppercase tracking-wider block">Shipping Address</span>
                <p className="font-semibold text-neutral-900">
                  {[selectedDetailsOrder.city, selectedDetailsOrder.country].filter(Boolean).join(", ") || "Pakistan"}
                </p>
                <p className="text-neutral-600">{selectedDetailsOrder.address || "Standard Delivery"}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-neutral-500 tracking-wider mb-2">
                Order Items ({selectedDetailsOrder.items?.length || 0})
              </h4>
              <div className="border border-neutral-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-100">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3">Variant</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedDetailsOrder.items && selectedDetailsOrder.items.length > 0 ? (
                      selectedDetailsOrder.items.map((it: any, idx: number) => {
                        const lineTotal = (Number(it.price) || 0) * (Number(it.quantity) || 1);
                        return (
                          <tr key={idx} className="hover:bg-neutral-50/50">
                            <td className="py-2.5 px-3 font-medium text-neutral-900">
                              <div className="flex items-center gap-2">
                                {it.image && (
                                  <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                                    <Image src={it.image} alt={it.name} fill className="object-cover" />
                                  </div>
                                )}
                                <span>{it.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-neutral-500">
                              {it.variant ? (
                                <span className="px-2 py-0.5 bg-neutral-100 rounded-md font-medium text-[11px]">
                                  {it.variant}
                                </span>
                              ) : (
                                "Standard"
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">{it.quantity}</td>
                            <td className="py-2.5 px-3 text-right text-neutral-600">
                              PKR {Number(it.price).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-neutral-900">
                              PKR {lineTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-neutral-400">No items</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            {(() => {
              const itemsSubtotal = (selectedDetailsOrder.items || []).reduce(
                (sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
                0
              );
              const discount = Number(selectedDetailsOrder.discountAmount) || 0;
              const totalAmount = Number(selectedDetailsOrder.totalAmount) || 0;
              const calculatedShipping = Math.max(0, totalAmount - (itemsSubtotal - discount));

              return (
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Payment Method:</span>
                    <span className="font-semibold uppercase text-neutral-900">
                      {selectedDetailsOrder.paymentMethod === "bank_transfer" ? "Bank Transfer" : "Cash on Delivery"}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-neutral-900">
                      PKR {itemsSubtotal.toLocaleString()}
                    </span>
                  </div>
                  {selectedDetailsOrder.discountCode && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Coupon Applied ({selectedDetailsOrder.discountCode}):</span>
                      <span>-PKR {discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-600">
                    <span>Shipping:</span>
                    {calculatedShipping > 0 ? (
                      <span className="font-semibold text-neutral-900">
                        PKR {calculatedShipping.toLocaleString()}
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-600">FREE</span>
                    )}
                  </div>
                  <div className="flex justify-between text-base font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                    <span>Grand Total:</span>
                    <span>PKR {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              );
            })()}

            {/* Bank Transfer Receipt Link if exists */}
            {selectedDetailsOrder.paymentMethod === "bank_transfer" && (
              <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-purple-950 block">Bank Transfer Status:</span>
                  <span className="text-purple-700 font-medium">
                    {selectedDetailsOrder.paymentStatus}
                  </span>
                </div>
                {selectedDetailsOrder.paymentProof && (
                  <button
                    onClick={() => {
                      setSelectedProofOrder(selectedDetailsOrder);
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition cursor-pointer"
                  >
                    Inspect Receipt Screenshot
                  </button>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-neutral-500">Status:</span>
                <select
                  value={selectedDetailsOrder.status}
                  onChange={(e) => handleUpdateStatus(selectedDetailsOrder.id, e.target.value)}
                  className="py-1.5 px-3 text-xs font-bold bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => printInvoiceDocument(selectedDetailsOrder)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-xl inline-flex items-center justify-center gap-1.5 transition cursor-pointer w-full sm:w-auto"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Packing Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDetailsOrder(null)}
                  className="w-full sm:w-auto px-5 py-2 text-xs font-semibold bg-black hover:bg-neutral-800 text-white rounded-xl shadow-xs transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Bank Receipt Screenshot Proof Modal */}
      {selectedProofOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
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

            {/* Customer & Amount Banner */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-2xl text-xs">
              <div>
                <span className="text-neutral-400 font-medium block">Payer</span>
                <span className="font-semibold text-neutral-900">{selectedProofOrder.customerName}</span>
                <span className="text-neutral-500 block truncate">{selectedProofOrder.customerEmail}</span>
              </div>
              <div className="text-right">
                <span className="text-neutral-400 font-medium block">Expected Amount</span>
                <span className="font-bold text-base text-neutral-900">
                  PKR {Number(selectedProofOrder.totalAmount).toLocaleString()}
                </span>
                <span className="text-neutral-500 block">{selectedProofOrder.paymentStatus}</span>
              </div>
            </div>

            {/* Image viewer */}
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
                  <div className="text-neutral-400 text-sm">No screenshot uploaded</div>
                )}
              </div>
            </div>

            {/* Verification Actions */}
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
