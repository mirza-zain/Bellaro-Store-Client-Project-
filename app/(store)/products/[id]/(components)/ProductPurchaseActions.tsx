'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Minus, Plus, ShoppingBag, ArrowRight, Ruler, X } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { ProductVariant } from "@/app/db/schema";

interface Props {
  productId: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  variants?: ProductVariant[];
  colors?: string[];
}

const getColorHex = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes("black")) return "#171717";
  if (n.includes("white")) return "#ffffff";
  if (n.includes("mustard")) return "#e1ad01";
  if (n.includes("peach")) return "#fba476";
  if (n.includes("dark brown") || n.includes("chocolate") || n.includes("coffee")) return "#3e2723";
  if (n.includes("brown")) return "#5d4037";
  if (n.includes("tan") || n.includes("camel") || n.includes("cognac")) return "#b87333";
  if (n.includes("burgundy") || n.includes("oxblood") || n.includes("maroon")) return "#6b1426";
  if (n.includes("navy")) return "#1a2a44";
  if (n.includes("blue")) return "#2563eb";
  if (n.includes("olive") || n.includes("green")) return "#556b2f";
  if (n.includes("charcoal") || n.includes("grey") || n.includes("gray")) return "#4b5563";
  if (n.includes("beige") || n.includes("cream")) return "#f5f5f4";
  return "#262626";
};

export default function ProductPurchaseActions({
  productId,
  name,
  category,
  price,
  stock,
  image,
  variants = [],
  colors = [],
}: Props) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<string>(
    variants.length > 0 ? variants[0].label : ""
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    colors.length > 0 ? colors[0] : ""
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const activeVariant = variants.find((v) => v.label === selectedVariant) || (variants.length > 0 ? variants[0] : null);
  const currentPrice = activeVariant ? Number(activeVariant.price) : price;
  const currentStock = activeVariant ? Number(activeVariant.stock) : stock;
  const inStock = currentStock > 0;

  const isFootwear = category?.toLowerCase() === "footwear";
  let variantDisplay = selectedVariant;
  if (isFootwear && selectedVariant) {
    const num = parseInt(selectedVariant.replace(/\D/g, ""), 10);
    if (!isNaN(num)) {
      if (num >= 28 && num <= 38 && !selectedVariant.toLowerCase().includes("kid")) {
        variantDisplay = `Kids (Size ${num})`;
      } else if (num >= 39 && num <= 48 && !selectedVariant.toLowerCase().includes("adult")) {
        variantDisplay = `Adults (Size ${num})`;
      }
    }
  }

  const combinedVariantLabel = [
    selectedColor ? selectedColor : null,
    variantDisplay ? variantDisplay : null,
  ].filter(Boolean).join(" • ");

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart({
      productId,
      name,
      category,
      price: currentPrice,
      quantity,
      image,
      variant: combinedVariantLabel || undefined,
      maxStock: currentStock,
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 2500);
  };

  const handleBuyNow = () => {
    if (!inStock) return;
    addToCart({
      productId,
      name,
      category,
      price: currentPrice,
      quantity,
      image,
      variant: combinedVariantLabel || undefined,
      maxStock: currentStock,
    });
    router.push("/checkout");
  };

  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const isKidsShoeSize = (label: string) => {
    const num = parseInt(label.replace(/\D/g, ""), 10);
    return !isNaN(num) && num >= 28 && num <= 38;
  };

  const isAdultShoeSize = (label: string) => {
    const num = parseInt(label.replace(/\D/g, ""), 10);
    return !isNaN(num) && num >= 39 && num <= 48;
  };

  const kidsVariants = isFootwear ? variants.filter((v) => isKidsShoeSize(v.label)) : [];
  const adultVariants = isFootwear ? variants.filter((v) => isAdultShoeSize(v.label)) : [];
  const otherVariants = isFootwear
    ? variants.filter((v) => !isKidsShoeSize(v.label) && !isAdultShoeSize(v.label))
    : variants;

  const renderVariantButton = (v: ProductVariant, i: number) => {
    const isSelected = selectedVariant === v.label;
    const vStock = Number(v.stock) || 0;
    const isVOutOfStock = vStock <= 0;

    return (
      <button
        key={`${v.label}-${i}`}
        type="button"
        onClick={() => {
          setSelectedVariant(v.label);
          if (quantity > vStock && vStock > 0) {
            setQuantity(vStock);
          }
        }}
        className={`px-3.5 sm:px-4 py-2 border rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 max-w-full min-h-[42px] touch-manipulation ${
          isSelected
            ? "border-black bg-black text-white shadow-xs"
            : isVOutOfStock
            ? "border-neutral-200 text-neutral-400 bg-neutral-50 hover:border-neutral-300"
            : "border-neutral-200 text-neutral-800 hover:border-neutral-400 bg-white"
        }`}
      >
        <span className="font-semibold">{v.label}</span>
        {Number(v.price) !== price && (
          <span className={`text-[11px] sm:text-xs shrink-0 ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>
            PKR {Number(v.price).toLocaleString()}
          </span>
        )}
        {isVOutOfStock && (
          <span className="text-[10px] text-rose-500 font-bold uppercase shrink-0">(Sold Out)</span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Color Selection (Leather / Shade) */}
      {colors && colors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase text-neutral-700 tracking-wider">
              Available Colors
            </label>
            {selectedColor && (
              <span className="text-xs text-neutral-500 font-medium">
                Color: <strong className="text-black font-semibold">{selectedColor}</strong>
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const isSelected = selectedColor === c;
              const swatchHex = getColorHex(c);
              const isLight =
                swatchHex === "#ffffff" ||
                swatchHex === "#f5f5f4" ||
                swatchHex === "#fba476" ||
                swatchHex === "#e1ad01";

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition cursor-pointer min-h-[42px] touch-manipulation ${
                    isSelected
                      ? "border-black bg-black text-white shadow-xs"
                      : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full shrink-0 border ${
                      isLight ? "border-neutral-300" : "border-white/30"
                    }`}
                    style={{ backgroundColor: swatchHex }}
                  />
                  <span>{c}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Variants Selection */}
      {variants && variants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase text-neutral-700">
                {isFootwear ? "Select Shoe Size" : "Select Variant / Volume"}
              </label>
              {isFootwear && (
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(!showSizeGuide)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 hover:text-black underline cursor-pointer"
                >
                  <Ruler className="w-3 h-3" />
                  <span>Size Guide</span>
                </button>
              )}
            </div>
            {selectedVariant && (
              <span className="text-xs text-neutral-500 font-medium">
                Selected: <strong className="text-black">{selectedVariant}</strong>
              </span>
            )}
          </div>

          {/* Size Guide Info Drawer */}
          {showSizeGuide && isFootwear && (
            <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between font-bold text-neutral-900">
                <span className="flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Footwear Size Guide (Pakistan / EU Scale)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(false)}
                  className="p-1 text-neutral-400 hover:text-black rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-white rounded-xl border border-neutral-200/80">
                  <p className="font-bold text-amber-800">🧒 Kids Sizes (31 to 38)</p>
                  <p className="text-neutral-500 mt-0.5">
                    For boys &amp; girls approx. 6–13 years. Insole length approx 19.5cm – 24.5cm.
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-neutral-200/80">
                  <p className="font-bold text-neutral-900">👞 Adult Sizes (39 to 45)</p>
                  <p className="text-neutral-500 mt-0.5">
                    Standard adult fit (EU 39 = UK 6, EU 40 = UK 7 up to EU 45 = UK 11).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Grouped Footwear Sizes vs Standard Variants */}
          {isFootwear && (kidsVariants.length > 0 || adultVariants.length > 0) ? (
            <div className="space-y-3">
              {/* Kids Sizes Section */}
              {kidsVariants.length > 0 && (
                <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-900">
                      <span>🧒 Kids Sizes (31 to 38)</span>
                    </span>
                    <span className="text-[10px] text-amber-700 font-medium">Children / Junior</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {kidsVariants.map(renderVariantButton)}
                  </div>
                </div>
              )}

              {/* Adult Sizes Section */}
              {adultVariants.length > 0 && (
                <div className="p-3 bg-neutral-50/70 rounded-2xl border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-neutral-900">
                      <span>👞 Adult Sizes (39 to 45)</span>
                    </span>
                    <span className="text-[10px] text-neutral-500 font-medium">Standard Adult</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {adultVariants.map(renderVariantButton)}
                  </div>
                </div>
              )}

              {/* Other Sizes Section (if any) */}
              {otherVariants.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Additional Sizes
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {otherVariants.map(renderVariantButton)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {variants.map(renderVariantButton)}
            </div>
          )}

          {/* Active variant dynamic price & status indicator */}
          {activeVariant && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-neutral-100">
              <span className="text-lg font-bold text-neutral-900">
                PKR {currentPrice.toLocaleString()}
              </span>
              {currentStock <= 0 ? (
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  Out of Stock
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  In Stock
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quantity Selector (Only visible if in stock) */}
      {inStock && (
        <div>
          <label className="block text-xs font-semibold uppercase text-neutral-700 mb-2">
            Quantity
          </label>
          <div className="inline-flex items-center border border-neutral-200 rounded-xl bg-white p-1">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4 text-neutral-700" />
            </button>
            <span className="w-12 text-center text-sm font-bold text-neutral-900">
              {quantity}
            </span>
            <button
              type="button"
              disabled={quantity >= currentStock}
              onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4 text-neutral-700" />
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {inStock ? (
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={handleAddToCart}
            className={`flex-1 py-4 px-6 text-base font-semibold rounded-2xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
              added
                ? "bg-emerald-600 text-white"
                : "bg-black text-white hover:bg-neutral-800"
            }`}
          >
            {added ? (
              <>
                <Check className="w-5 h-5" />
                <span>Added to Bag!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                <span>Add to Bag</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            className="flex-1 py-4 px-6 border-2 border-neutral-900 text-neutral-900 text-base font-semibold rounded-2xl hover:bg-neutral-100 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Buy Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="pt-1 space-y-2">
          <div className="w-full py-4 px-6 text-base font-bold rounded-2xl bg-neutral-100 border border-neutral-200 text-neutral-500 flex items-center justify-center gap-2 select-none">
            <span>Out of Stock</span>
          </div>
          <p className="text-xs text-neutral-400 text-center">
            This item is currently sold out. Please select another variant or check back soon.
          </p>
        </div>
      )}

      {/* Added Confirmation Banner */}
      {added && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Item successfully added to your shopping bag.</span>
          </div>
          <Link
            href="/cart"
            className="font-bold underline hover:text-emerald-950 ml-3 shrink-0"
          >
            View Bag →
          </Link>
        </div>
      )}
    </div>
  );
}

