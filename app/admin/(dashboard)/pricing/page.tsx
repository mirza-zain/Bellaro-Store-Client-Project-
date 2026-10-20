import React, { Suspense } from "react";
import { getDiscountCodesAction } from "@/app/lib/actions/admin";
import { getShippingRulesAction } from "@/app/lib/actions/shipping";
import PricingAndShippingManager from "./(components)/PricingAndShippingManager";

export const instant = false;

async function PricingContent() {
  const [codes, shippingRules] = await Promise.all([
    getDiscountCodesAction(),
    getShippingRulesAction(),
  ]);

  return (
    <PricingAndShippingManager
      initialCodes={codes}
      initialShippingRules={shippingRules}
    />
  );
}

export default function PricingRulesPage() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <Suspense
        fallback={
          <div className="p-8 bg-white rounded-3xl border border-neutral-200 animate-pulse space-y-6 shadow-xs">
            <div className="h-6 bg-neutral-200 rounded w-1/4" />
            <div className="h-48 bg-neutral-100 rounded-2xl" />
            <div className="h-48 bg-neutral-100 rounded-2xl" />
          </div>
        }
      >
        <PricingContent />
      </Suspense>
    </div>
  );
}
