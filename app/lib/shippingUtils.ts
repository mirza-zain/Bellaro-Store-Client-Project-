import { ShippingRule } from "@/app/db/schema";

export type ShippingCalculation = {
  fee: number;
  isFree: boolean;
  freeThreshold: number;
  remainingForFree: number;
  rateType: "default" | "city" | "free";
  matchedCity?: string;
};

/**
 * Pure calculation logic for delivery fee based on rules, subtotal, and destination city.
 * Callable on both client and server safely.
 */
export function computeShippingFee(
  subtotal: number,
  city?: string,
  rules: ShippingRule[] = []
): ShippingCalculation {
  // Find the default rule (fallback)
  const defaultRule = rules.find(
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

  const defaultFee = Number(defaultRule.charge) || 250;
  const freeThreshold = Number(defaultRule.freeShippingThreshold) || 8000;
  const isFreeActive = defaultRule.isActive ?? true;

  // Check if order qualifies for Free Shipping threshold
  if (isFreeActive && subtotal >= freeThreshold) {
    return {
      fee: 0,
      isFree: true,
      freeThreshold,
      remainingForFree: 0,
      rateType: "free",
    };
  }

  const remainingForFree = Math.max(0, freeThreshold - subtotal);

  // If a city is provided, look for a matching city-specific rate (case-insensitive)
  if (city && city.trim()) {
    const cleanCity = city.trim().toLowerCase();
    const cityRule = rules.find((r) => {
      if (r.isDefault || r.city.trim().toUpperCase() === "DEFAULT") return false;
      const ruleCity = r.city.trim().toLowerCase();
      return ruleCity === cleanCity || cleanCity.includes(ruleCity) || ruleCity.includes(cleanCity);
    });

    if (cityRule) {
      return {
        fee: Number(cityRule.charge) || 0,
        isFree: false,
        freeThreshold,
        remainingForFree,
        rateType: "city",
        matchedCity: cityRule.city,
      };
    }
  }

  // Fallback to default delivery fee
  return {
    fee: defaultFee,
    isFree: false,
    freeThreshold,
    remainingForFree,
    rateType: "default",
  };
}
