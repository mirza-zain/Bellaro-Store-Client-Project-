import React, { Suspense } from "react";
import { getDashboardData } from "@/app/lib/actions/admin";
import AdminClientView from "./(components)/AdminClientView";

export const instant = false;

async function DashboardData() {
  const data = await getDashboardData();
  return (
    <AdminClientView
      stats={data.stats}
      products={data.recentProducts}
      orders={data.recentOrders}
      initialSizePresets={data.sizePresets}
    />
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <Suspense
        fallback={
          <div className="p-6 md:p-8 space-y-6 animate-pulse">
            <div className="h-8 bg-neutral-200 rounded-lg w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-neutral-200 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
              <div className="lg:col-span-2 h-96 bg-neutral-200 rounded-2xl" />
              <div className="h-96 bg-neutral-200 rounded-2xl" />
            </div>
          </div>
        }
      >
        <DashboardData />
      </Suspense>
    </div>
  );
}
