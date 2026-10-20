import React, { Suspense } from "react";
import { getAllProductsAction } from "@/app/lib/actions/admin";
import ProductsManager from "./(components)/ProductsManager";

export const instant = false;

async function ProductsData() {
  const allProducts = await getAllProductsAction();
  return <ProductsManager initialProducts={allProducts} />;
}

export default function ManageProductsPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Manage Products
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Catalog inventory, stock levels, quick pricing adjustments, and Cloudinary uploads.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="p-8 bg-white rounded-3xl border border-neutral-200 animate-pulse space-y-4 shadow-xs">
            <div className="h-6 bg-neutral-200 rounded w-1/4" />
            <div className="h-16 bg-neutral-100 rounded-xl" />
            <div className="h-16 bg-neutral-100 rounded-xl" />
            <div className="h-16 bg-neutral-100 rounded-xl" />
          </div>
        }
      >
        <ProductsData />
      </Suspense>
    </div>
  );
}
