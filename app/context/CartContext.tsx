'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

export type CartItem = {
  id: string; // Unique cart item ID (e.g. `${productId}-${variant}`)
  productId: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
  maxStock?: number;
};

interface CartContextType {
  items: CartItem[];
  isLoaded: boolean;
  totalItems: number;
  subtotal: number;
  shippingFee: number;
  freeShippingThreshold: number;
  progressToFreeShipping: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addToCart: (item: Omit<CartItem, "id">) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

import { ShippingRule } from "@/app/db/schema";
import { getShippingRulesAction } from "@/app/lib/actions/shipping";

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "bazzario_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  // Load cart from localStorage and shipping rules on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    } finally {
      setIsLoaded(true);
    }

    getShippingRulesAction()
      .then((rules) => {
        if (rules && rules.length > 0) setShippingRules(rules);
      })
      .catch((err) => console.error("Error loading shipping rules in cart:", err));
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error("Failed to save cart to localStorage", e);
      }
    }
  }, [items, isLoaded]);

  const addToCart = (newItem: Omit<CartItem, "id">) => {
    setItems((prevItems) => {
      const uniqueId = `${newItem.productId}-${newItem.variant || "default"}`;
      const existingIndex = prevItems.findIndex((i) => i.id === uniqueId);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const existing = updated[existingIndex];
        const max = existing.maxStock ?? 999;
        const newQty = Math.min(existing.quantity + newItem.quantity, max);
        updated[existingIndex] = { ...existing, quantity: newQty };
        return updated;
      } else {
        const itemWithId: CartItem = {
          ...newItem,
          id: uniqueId,
        };
        return [...prevItems, itemWithId];
      }
    });
    setIsDrawerOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.id === id) {
            const max = item.maxStock ?? 999;
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return { ...item, quantity: Math.min(newQty, max) };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear cart storage", e);
    }
  };

  // Derived calculations
  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const defaultRule = shippingRules.find(
    (r) => r.isDefault || r.city.trim().toUpperCase() === "DEFAULT"
  );
  const freeThreshold = defaultRule ? Number(defaultRule.freeShippingThreshold) || 8000 : 8000;
  const defaultFee = defaultRule ? Number(defaultRule.charge) || 250 : 250;
  const isFreeActive = defaultRule?.isActive ?? true;

  const shippingFee = useMemo(
    () => (items.length === 0 || (isFreeActive && subtotal >= freeThreshold) ? 0 : defaultFee),
    [items.length, subtotal, isFreeActive, freeThreshold, defaultFee]
  );

  const progressToFreeShipping = useMemo(
    () => Math.min((subtotal / freeThreshold) * 100, 100),
    [subtotal, freeThreshold]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isLoaded,
        totalItems,
        subtotal,
        shippingFee,
        freeShippingThreshold: freeThreshold,
        progressToFreeShipping,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

