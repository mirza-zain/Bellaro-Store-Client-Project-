import React, { Suspense } from "react";
import { getDashboardData } from "@/app/lib/actions/admin";
import { ArrowUpRight, DollarSign, Package, TrendingUp } from "lucide-react";

export const instant = false;

async function SalesContent() {
  const data = await getDashboardData();
  const avgOrderValue =
    data.stats.totalOrders > 0
      ? Math.round(data.stats.totalRevenue / data.stats.totalOrders)
      : 0;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Gross Sales</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-bold text-neutral-900 mt-3">
            PKR {data.stats.totalRevenue.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.2% from last month</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Average Order Value</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ArrowUpRight className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-bold text-neutral-900 mt-3">
            PKR {avgOrderValue.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium mt-2">
            <span>Per completed transaction</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Orders</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Package className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-bold text-neutral-900 mt-3">
            {data.stats.totalOrders}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium mt-2">
            <span>Store lifetime fulfillments</span>
          </div>
        </div>
      </div>

      {/* Recent High Value Orders */}
      <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs">
        <h3 className="text-base font-bold text-neutral-900 mb-4">Recent Sales Activity</h3>
        <div className="divide-y divide-neutral-100">
          {data.recentOrders.slice(0, 5).map((order) => (
            <div key={order.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{order.customerName}</p>
                <p className="text-xs text-neutral-400">Order #{order.id} • {order.city || "Pakistan"}</p>
              </div>
              <span className="text-sm font-bold text-neutral-900">
                PKR {Number(order.totalAmount).toLocaleString()}
              </span>
            </div>
          ))}
          {data.recentOrders.length === 0 && (
            <p className="text-sm text-neutral-400 py-4 text-center">No orders recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Monthly Sales & Analytics
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Detailed sales performance, average order values, and revenue breakdowns.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-neutral-200 rounded-2xl" />
              ))}
            </div>
            <div className="h-64 bg-neutral-200 rounded-2xl" />
          </div>
        }
      >
        <SalesContent />
      </Suspense>
    </div>
  );
}
