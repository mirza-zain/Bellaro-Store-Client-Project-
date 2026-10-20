'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
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
}

export default function ProductPurchaseActions({
  productId,
  name,
  category,
  price,
  stock,
  image,
  variants = [],
}: Props) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<string>(
    variants.length > 0 ? variants[0].label : ""
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const activeVariant = variants.find((v) => v.label === selectedVariant) || (variants.length > 0 ? variants[0] : null);
  const currentPrice = activeVariant ? Number(activeVariant.price) : price;
  const currentStock = activeVariant ? Number(activeVariant.stock) : stock;
  const inStock = currentStock > 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart({
      productId,
      name,
      category,
      price: currentPrice,
      quantity,
      image,
      variant: selectedVariant || undefined,
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
      variant: selectedVariant || undefined,
      maxStock: currentStock,
    });
    router.push("/checkout");
  };

  return (
    <div className="space-y-6">
      {/* Variants Selection */}
      {variants && variants.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase text-neutral-700">
              Select Variant / Size
            </label>
            {selectedVariant && (
              <span className="text-xs text-neutral-500 font-medium">
                Selected: <strong className="text-black">{selectedVariant}</strong>
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {variants.map((v, i) => {
              const isSelected = selectedVariant === v.label;
              const vStock = Number(v.stock) || 0;
              const isVOutOfStock = vStock <= 0;

              return (
                <button
                  key={i}
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
            })}
          </div>

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

