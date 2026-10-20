'use client';

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ShoppingBag,
  ArrowRight,
  Minus,
  Plus,
  Trash2,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "@/app/context/CartContext";

export default function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isLoaded,
    totalItems,
    subtotal,
    shippingFee,
    freeShippingThreshold,
    progressToFreeShipping,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
  } = useCart();

  // Prevent background body scrolling when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  const total = subtotal + shippingFee;

  const handleCheckout = () => {
    closeDrawer();
    router.push("/checkout");
  };

  const handleViewCart = () => {
    closeDrawer();
    router.push("/cart");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-black" />
              <h2 className="text-lg font-bold uppercase tracking-tight text-neutral-900">
                Shopping Bag
              </h2>
              {isLoaded && totalItems > 0 && (
                <span className="px-2 py-0.5 bg-black text-white text-xs font-semibold rounded-full">
                  {totalItems}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={closeDrawer}
              className="p-2 text-neutral-400 hover:text-black rounded-xl hover:bg-neutral-100 transition cursor-pointer"
              aria-label="Close bag drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Meter */}
          <div className="px-5 py-3.5 bg-neutral-50 border-b border-neutral-200/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 mb-1.5">
              <Truck className="w-3.5 h-3.5 text-black" />
              <span>
                {subtotal >= freeShippingThreshold
                  ? "🎉 You unlocked FREE Express Shipping!"
                  : `Add PKR ${(freeShippingThreshold - subtotal).toLocaleString()} more for FREE shipping`}
              </span>
            </div>
            <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-black h-full rounded-full transition-all duration-500"
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </div>
          </div>

          {/* Items List Body */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-neutral-100">
            {!isLoaded ? (
              <div className="py-20 text-center">
                <div className="inline-block w-6 h-6 border-2 border-neutral-300 border-t-black rounded-full animate-spin mb-2" />
                <p className="text-xs text-neutral-400">Loading bag...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto text-neutral-400">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-base">Your bag is empty</h3>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-1">
                    Explore our latest heavyweight hoodies, tees, and jewelry.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    router.push("/products");
                  }}
                  className="px-6 py-2.5 bg-black text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition cursor-pointer"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-4 flex gap-3.5 items-center">
                  <Link
                    href={`/products/${item.productId}`}
                    onClick={closeDrawer}
                    className="relative w-18 h-18 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shrink-0 block"
                  >
                    <Image
                      src={item.image || "/images/img1.jpg"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.productId}`}
                      onClick={closeDrawer}
                      className="font-semibold text-sm text-neutral-900 truncate block hover:underline"
                    >
                      {item.name}
                    </Link>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-neutral-400">{item.category}</span>
                      {item.variant && (
                        <span className="text-[10px] font-medium bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded border border-neutral-200">
                          {item.variant}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-bold text-neutral-900 mt-1">
                      PKR {item.price.toLocaleString()}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="inline-flex items-center border border-neutral-200 rounded-lg bg-neutral-50 p-0.5">
                        <button
                          type="button"
                          disabled={item.quantity <= 1}
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded text-neutral-600 hover:text-black hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded text-neutral-600 hover:text-black hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-neutral-400 hover:text-rose-600 transition cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-neutral-900">
                      PKR {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Sticky Footer */}
          {items.length > 0 && (
            <div className="p-5 border-t border-neutral-200 bg-neutral-50/80 space-y-4">
              <div className="space-y-1.5 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900">
                    PKR {subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-neutral-900">
                    {shippingFee === 0 ? "FREE" : `PKR ${shippingFee}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-neutral-200 flex justify-between text-base font-bold text-neutral-900">
                  <span>Total</span>
                  <span>PKR {total.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full py-3.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleViewCart}
                  className="w-full py-2.5 bg-white border border-neutral-300 text-neutral-800 text-xs font-semibold rounded-xl hover:bg-neutral-100 transition cursor-pointer"
                >
                  View Full Shopping Bag
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cash on Delivery in Karachi • 100% Secure Checkout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
