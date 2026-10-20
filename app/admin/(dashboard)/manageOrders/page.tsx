import React, { Suspense } from "react";
import { getAllOrdersAction } from "@/app/lib/actions/admin";
import OrdersManager from "./(components)/OrdersManager";

export const instant = false;

async function OrdersData() {
  const allOrders = await getAllOrdersAction();
  return <OrdersManager initialOrders={allOrders} />;
}

export default function ManageOrdersPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Manage Orders
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Review customer shipments, verify bank transfer receipts, and update order fulfillments.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="p-8 bg-white rounded-3xl border border-neutral-200 animate-pulse space-y-4 shadow-xs">
            <div className="h-6 bg-neutral-200 rounded w-1/4" />
            <div className="h-14 bg-neutral-100 rounded-xl" />
            <div className="h-14 bg-neutral-100 rounded-xl" />
            <div className="h-14 bg-neutral-100 rounded-xl" />
          </div>
        }
      >
        <OrdersData />
      </Suspense>
    </div>
  );
}
