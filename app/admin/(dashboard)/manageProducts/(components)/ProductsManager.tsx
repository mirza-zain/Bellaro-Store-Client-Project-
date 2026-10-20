'use client';

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Edit,
  Eye,
  Minus,
  Package,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
  Tag,
  AlertCircle,
  ExternalLink,
  Loader2,
  Layers,
} from "lucide-react";
import { Product, ProductVariant } from "@/app/db/schema";
import {
  addProductAction,
  updateProductAction,
  updateProductStockAction,
  deleteProductAction,
} from "@/app/lib/actions/admin";

interface ProductsManagerProps {
  initialProducts: Product[];
}

async function resizeImageBeforeUpload(file: File): Promise<File | Blob> {
  if (!file.type.startsWith("image/") || file.type.includes("svg") || file.size < 800 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxWidth = 1600;
      const maxHeight = 1600;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }));
          } else {
            resolve(file);
          }
        },
        "image/webp",
        0.88
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

async function uploadToCloudinaryClient(file: File): Promise<string | null> {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dddsn39gd";
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "bazaario";

    let uploadFile: File | Blob = file;
    if (file.size > 800 * 1024) {
      try {
        uploadFile = await resizeImageBeforeUpload(file);
      } catch (e) {
        console.warn("Resize error:", e);
      }
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "bazzario/products");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok && (data.secure_url || data.url)) {
      return data.secure_url || data.url;
    }
    console.warn("Cloudinary upload response:", data);
    return null;
  } catch (err) {
    console.warn("Cloudinary direct fetch failed:", err);
    return null;
  }
}

export default function ProductsManager({ initialProducts }: ProductsManagerProps) {
  const router = useRouter();
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Dynamic existing categories derived from current products
  const existingCategories = useMemo(() => {
    const defaultSet = new Set<string>(["Clothing", "Jewelry", "Accessories"]);
    productsList.forEach((p) => {
      if (p.category && p.category.trim()) {
        defaultSet.add(p.category.trim());
      }
    });
    return Array.from(defaultSet).sort();
  }, [productsList]);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for Add / Edit
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Clothing");
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [customNewCategory, setCustomNewCategory] = useState("");
  const [formSubCategory, setFormSubCategory] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);
  const [formImage, setFormImage] = useState("");
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [formSelectedFile, setFormSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Derived variant calculations
  const hasVariants = formVariants.length > 0;
  const totalVariantStock = formVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  const minVariantPrice = formVariants.length > 0 ? Math.min(...formVariants.map((v) => Number(v.price) || 0)) : 0;
  const maxVariantPrice = formVariants.length > 0 ? Math.max(...formVariants.map((v) => Number(v.price) || 0)) : 0;

  // Keep state updated on server revalidation
  useEffect(() => {
    setProductsList(initialProducts);
  }, [initialProducts]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormDescription("");
    setFormCategory(existingCategories[0] || "Clothing");
    setIsCreatingNewCategory(false);
    setCustomNewCategory("");
    setFormSubCategory("");
    setFormPrice("");
    setFormStock("20");
    setFormVariants([]);
    setFormImage("");
    setFormImagePreview(null);
    setFormSelectedFile(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description || "");
    setFormCategory(product.category);
    setIsCreatingNewCategory(false);
    setCustomNewCategory("");
    setFormSubCategory(product.subCategory === "General" ? "" : (product.subCategory || ""));
    setFormPrice(product.price ? product.price.toString() : "");
    setFormStock(product.stock ? product.stock.toString() : "");
    const existingVariants = Array.isArray(product.variants) ? [...product.variants] : [];
    setFormVariants(existingVariants);
    setFormImage(product.image || "");
    setFormImagePreview(product.image || null);
    setFormSelectedFile(null);
    setIsAddModalOpen(true);
  };

  // Variant management handlers
  const handleAddVariant = (label = "", priceVal?: string | number, stockVal?: string | number) => {
    const defaultPrice = Number(formPrice) || 0;
    const defaultStock = Number(formStock) || 10;
    setFormVariants((prev) => [
      ...prev,
      {
        label,
        price: priceVal !== undefined ? Number(priceVal) : defaultPrice,
        stock: stockVal !== undefined ? Number(stockVal) : defaultStock,
      },
    ]);
  };

  const handleQuickAddSizes = () => {
    const defaultPrice = Number(formPrice) || 0;
    const defaultStock = Number(formStock) || 10;
    const sizes = ["S", "M", "L", "XL"];
    setFormVariants((prev) => {
      const existingLabels = new Set(prev.map((v) => v.label.toUpperCase().trim()));
      const toAdd = sizes
        .filter((s) => !existingLabels.has(s))
        .map((s) => ({ label: s, price: defaultPrice, stock: defaultStock }));
      return [...prev, ...toAdd];
    });
  };

  const handleUpdateVariant = (
    index: number,
    field: "label" | "price" | "stock",
    value: string | number
  ) => {
    setFormVariants((prev) =>
      prev.map((v, i) => {
        if (i !== index) return v;
        if (field === "label") return { ...v, label: String(value) };
        if (field === "price") return { ...v, price: Math.max(0, Number(value) || 0) };
        if (field === "stock") return { ...v, stock: Math.max(0, Number(value) || 0) };
        return v;
      })
    );
  };

  const handleRemoveVariant = (index: number) => {
    setFormVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllVariants = () => {
    setFormVariants([]);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFormImagePreview(previewUrl);
      setFormImage("");
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("Please enter a product title.", "error");
      return;
    }

    const finalCategory = (isCreatingNewCategory ? customNewCategory.trim() : formCategory.trim());
    if (!finalCategory) {
      showToast("Please select or enter a category name.", "error");
      return;
    }

    let finalPrice = formPrice;
    let finalStock = formStock || "0";

    if (hasVariants) {
      for (let i = 0; i < formVariants.length; i++) {
        const v = formVariants[i];
        if (!v.label.trim()) {
          showToast(`Variant #${i + 1} is missing a name/label.`, "error");
          return;
        }
        if (Number(v.price) <= 0) {
          showToast(`Variant "${v.label}" must have a price greater than 0.`, "error");
          return;
        }
      }
      finalPrice = minVariantPrice.toString();
      finalStock = totalVariantStock.toString();
    } else {
      if (!formPrice || Number(formPrice) <= 0) {
        showToast("Please enter a valid product price.", "error");
        return;
      }
    }

    setIsUploading(true);
    let finalImageUrl = formImage.trim();

    // Direct Cloudinary upload from client to eliminate server payload limits
    if (formSelectedFile) {
      try {
        const uploadedUrl = await uploadToCloudinaryClient(formSelectedFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      } catch (err) {
        console.warn("Direct upload error, falling back to server:", err);
      }
    }

    const formData = new FormData();
    formData.append("name", formName.trim());
    formData.append("description", formDescription.trim());
    formData.append("category", finalCategory);
    formData.append("subCategory", formSubCategory.trim() || "General");
    formData.append("price", finalPrice);
    formData.append("stock", finalStock);
    formData.append("variants", JSON.stringify(hasVariants ? formVariants : []));
    formData.append("image", finalImageUrl);

    // If direct upload failed to produce URL and we still have a file, send the single file
    if (!finalImageUrl && formSelectedFile) {
      formData.append("imageFile", formSelectedFile);
    }

    startTransition(async () => {
      try {
        if (editingProduct) {
          // Optimistic update
          setProductsList((prev) =>
            prev.map((p) =>
              p.id === editingProduct.id
                ? {
                    ...p,
                    name: formName.trim(),
                    description: formDescription.trim(),
                    category: finalCategory,
                    subCategory: formSubCategory.trim() || "General",
                    price: finalPrice,
                    stock: finalStock,
                    image: finalImageUrl || p.image,
                    variants: hasVariants ? formVariants : [],
                  }
                : p
            )
          );

          const res = await updateProductAction(editingProduct.id, formData);
          if (res.success) {
            setIsAddModalOpen(false);
            setEditingProduct(null);
            showToast(`Product "${formName}" updated successfully!`);
            router.refresh();
          } else {
            showToast(res.error || "Failed to update product", "error");
            setProductsList(initialProducts);
          }
        } else {
          const res = await addProductAction(formData);
          if (res.success) {
            setIsAddModalOpen(false);
            showToast(`Product "${formName}" created successfully!`);
            router.refresh();
          } else {
            showToast(res.error || "Failed to add product", "error");
          }
        }
      } finally {
        setIsUploading(false);
      }
    });
  };

  const handleDeleteProduct = (id: number, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    // Optimistic delete
    setProductsList((prev) => prev.filter((p) => p.id !== id));

    startTransition(async () => {
      const res = await deleteProductAction(id);
      if (res.success) {
        showToast(`Product "${name}" deleted.`);
        router.refresh();
      } else {
        showToast(res.error || "Failed to delete product.", "error");
        setProductsList(initialProducts);
      }
    });
  };

  const handleAdjustStock = (product: Product, delta: number) => {
    const current = Number(product.stock) || 0;
    const newStock = Math.max(0, current + delta);

    // Optimistic update
    setProductsList((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: newStock.toString() } : p))
    );

    startTransition(async () => {
      const res = await updateProductStockAction(product.id, newStock);
      if (res.success) {
        showToast(`Stock for ${product.name} updated to ${newStock}.`);
        router.refresh();
      } else {
        showToast("Failed to update stock", "error");
        setProductsList(initialProducts);
      }
    });
  };

  // Metrics
  const totalCount = productsList.length;
  const inStockCount = productsList.filter((p) => Number(p.stock) > 0).length;
  const lowStockCount = productsList.filter((p) => Number(p.stock) > 0 && Number(p.stock) < 10).length;
  const outOfStockCount = productsList.filter((p) => Number(p.stock) <= 0).length;

  // Filtering
  const filteredProducts = productsList.filter((p) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      query === "" ||
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(query));

    const matchesCategory =
      categoryFilter === "all" || p.category.toLowerCase() === categoryFilter.toLowerCase();

    const stockNum = Number(p.stock) || 0;
    let matchesStock = true;
    if (stockFilter === "in_stock") matchesStock = stockNum > 0;
    if (stockFilter === "low_stock") matchesStock = stockNum > 0 && stockNum < 10;
    if (stockFilter === "out_of_stock") matchesStock = stockNum <= 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl text-sm flex items-center justify-between border shadow-sm transition animate-fade-in ${
            toastMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-neutral-400 hover:text-neutral-800 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Catalog Products ({totalCount})
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Create items, adjust stock counts, and edit prices across your entire store.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">Total Products</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{totalCount}</p>
          <span className="text-[11px] text-neutral-500">Active catalog</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-emerald-600 tracking-wider">In Stock</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{inStockCount}</p>
          <span className="text-[11px] text-neutral-500">Available to buy</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-amber-600 tracking-wider">Low Stock</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{lowStockCount}</p>
          <span className="text-[11px] text-amber-600 font-medium">&lt; 10 items remaining</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-rose-600 tracking-wider">Out of Stock</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{outOfStockCount}</p>
          <span className="text-[11px] text-neutral-500">Needs restock</span>
        </div>
      </div>

      {/* Filters and Table Container */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by title, category, or subcategory..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-700 focus:outline-hidden focus:border-black cursor-pointer truncate"
            >
              <option value="all">All Categories</option>
              {existingCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-700 focus:outline-hidden focus:border-black cursor-pointer truncate"
            >
              <option value="all">All Stock Levels</option>
              <option value="in_stock">In Stock (&gt;0)</option>
              <option value="low_stock">Low Stock (&lt;10)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>

            {(searchTerm || categoryFilter !== "all" || stockFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setStockFilter("all");
                }}
                className="col-span-2 sm:col-span-1 px-3 py-2 text-xs text-neutral-600 hover:text-black font-semibold whitespace-nowrap cursor-pointer text-center bg-neutral-100 sm:bg-transparent rounded-xl"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Mobile Product Cards (Finger-Friendly for Phones) */}
        <div className="block md:hidden space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 bg-neutral-50 rounded-2xl border border-neutral-100 p-6">
              <Package className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
              <p className="font-medium text-neutral-700 text-sm">No products found.</p>
              <button
                onClick={handleOpenAddModal}
                className="mt-2 text-xs font-semibold text-black underline cursor-pointer"
              >
                + Add a new product
              </button>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const stockNum = Number(p.stock) || 0;
              const isOutOfStock = stockNum <= 0;
              const isLowStock = stockNum > 0 && stockNum < 10;

              return (
                <div
                  key={p.id}
                  className="bg-neutral-50/70 border border-neutral-200/80 rounded-2xl p-3.5 space-y-3 shadow-xs"
                >
                  {/* Top: Image, Title, Category & Price */}
                  <div className="flex items-start gap-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0 border border-neutral-200">
                      <Image
                        src={p.image || "/images/img1.jpg"}
                        alt={p.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-200/80 text-neutral-800">
                          {p.category}
                        </span>
                        <span className="font-bold text-sm text-neutral-900">
                          PKR {Number(p.price).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-neutral-900 line-clamp-1 mt-1">
                        {p.name}
                      </h4>
                      <p className="text-xs text-neutral-400">
                        {p.subCategory || "General"}
                      </p>
                      {p.variants && p.variants.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          <span className="text-[10px] font-semibold text-neutral-700 bg-neutral-200/70 px-1.5 py-0.5 rounded">
                            {p.variants.length} variants:
                          </span>
                          {p.variants.map((v, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-white border border-neutral-200 text-neutral-800 px-1.5 py-0.5 rounded font-medium"
                            >
                              {v.label} ({v.stock})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Stock stepper & Edit/Delete actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          isOutOfStock
                            ? "bg-rose-100 text-rose-800"
                            : isLowStock
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isOutOfStock
                              ? "bg-rose-600"
                              : isLowStock
                              ? "bg-amber-600"
                              : "bg-emerald-600"
                          }`}
                        />
                        {stockNum} left
                      </span>

                      {/* Quick Adjust Stepper */}
                      <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-white">
                        <button
                          onClick={() => handleAdjustStock(p, -1)}
                          disabled={isPending || stockNum <= 0}
                          className="p-1 hover:bg-neutral-100 text-neutral-600 disabled:opacity-30 transition cursor-pointer"
                          title="Decrease stock by 1"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleAdjustStock(p, 5)}
                          disabled={isPending}
                          className="px-1.5 py-0.5 hover:bg-neutral-100 text-[10px] font-bold text-neutral-700 transition cursor-pointer border-l border-r border-neutral-200"
                          title="Restock +5"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleAdjustStock(p, 1)}
                          disabled={isPending}
                          className="p-1 hover:bg-neutral-100 text-neutral-600 transition cursor-pointer"
                          title="Increase stock by 1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-200/60 rounded-xl transition cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        disabled={isPending}
                        className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-100/60 rounded-xl transition cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-neutral-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Stock Level & Quick Adjust</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-neutral-500">
                    <Package className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                    <p className="font-medium text-neutral-700">No products match your criteria.</p>
                    <button
                      onClick={handleOpenAddModal}
                      className="mt-2 text-xs font-semibold text-black underline cursor-pointer"
                    >
                      + Create a new product
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const stockNum = Number(p.stock) || 0;
                  const isOutOfStock = stockNum <= 0;
                  const isLowStock = stockNum > 0 && stockNum < 10;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/70 transition">
                      {/* Product Thumbnail & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                            <Image
                              src={p.image || "/images/img1.jpg"}
                              alt={p.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 line-clamp-1">{p.name}</p>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {p.subCategory || "General"}
                            </p>
                            {p.variants && p.variants.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                <span className="text-[10px] font-semibold text-neutral-700 bg-neutral-200/60 px-1.5 py-0.5 rounded">
                                  {p.variants.length} variants:
                                </span>
                                {p.variants.map((v, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] bg-neutral-100 border border-neutral-200/80 text-neutral-700 px-1.5 py-0.5 rounded"
                                  >
                                    {v.label} ({v.stock})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800">
                          {p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-bold text-neutral-900">
                        PKR {Number(p.price).toLocaleString()}
                      </td>

                      {/* Stock Level with Quick Adjusters */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.8 rounded-full text-xs font-semibold ${
                              isOutOfStock
                                ? "bg-rose-100 text-rose-800"
                                : isLowStock
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOutOfStock
                                  ? "bg-rose-600"
                                  : isLowStock
                                  ? "bg-amber-600"
                                  : "bg-emerald-600"
                              }`}
                            />
                            {stockNum} units
                          </span>

                          {/* Quick Adjust Buttons */}
                          <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                            <button
                              onClick={() => handleAdjustStock(p, -1)}
                              disabled={isPending || stockNum <= 0}
                              className="p-1 hover:bg-neutral-200 text-neutral-600 disabled:opacity-30 transition cursor-pointer"
                              title="Decrease stock by 1"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleAdjustStock(p, 5)}
                              disabled={isPending}
                              className="px-1.5 py-0.5 hover:bg-neutral-200 text-[10px] font-bold text-neutral-700 transition cursor-pointer border-l border-r border-neutral-200"
                              title="Restock +5"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => handleAdjustStock(p, 1)}
                              disabled={isPending}
                              className="p-1 hover:bg-neutral-200 text-neutral-600 transition cursor-pointer"
                              title="Increase stock by 1"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-2 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-xl transition cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            disabled={isPending}
                            className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-neutral-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {editingProduct
                    ? `Editing ${editingProduct.name} (#${editingProduct.id})`
                    : "Fill in details to add a new product to your catalog."}
                </p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 sm:p-2 text-neutral-400 hover:text-neutral-900 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 mt-3 sm:mt-4">
              {/* 1. Product Name */}
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Oversized Heavyweight Acid Wash Tee"
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black font-medium"
                />
              </div>

              {/* 2. Description */}
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe materials, fit, care instructions..."
                  className="w-full px-3.5 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black"
                />
              </div>

              {/* 3. Category & 4. Sub-Category (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase text-neutral-700">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !isCreatingNewCategory;
                        setIsCreatingNewCategory(nextState);
                        if (nextState) {
                          setCustomNewCategory("");
                        } else {
                          setFormCategory(existingCategories[0] || "Clothing");
                        }
                      }}
                      className="text-[11px] font-semibold text-neutral-800 hover:text-black hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {isCreatingNewCategory ? (
                        <span>Choose existing</span>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>+ New Category</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isCreatingNewCategory ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        value={customNewCategory}
                        onChange={(e) => {
                          setCustomNewCategory(e.target.value);
                          setFormCategory(e.target.value);
                        }}
                        placeholder="Type new category..."
                        className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black font-medium"
                        autoFocus
                      />
                      <p className="text-[10px] text-neutral-400">
                        Will be created storewide
                      </p>
                    </div>
                  ) : (
                    <select
                      value={formCategory}
                      onChange={(e) => {
                        if (e.target.value === "__create_new__") {
                          setIsCreatingNewCategory(true);
                          setCustomNewCategory("");
                          setFormCategory("");
                        } else {
                          setFormCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black cursor-pointer font-medium"
                    >
                      {existingCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__create_new__">+ Create New Category...</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    Sub-Category <span className="text-neutral-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formSubCategory}
                    onChange={(e) => setFormSubCategory(e.target.value)}
                    placeholder="e.g. Graphic Tees, Chains (optional)"
                    className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black"
                  />
                </div>
              </div>

              {/* 5. Pricing & Variants Section */}
              <div className="border border-neutral-200 rounded-2xl p-3.5 sm:p-4 bg-neutral-50/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                      <span>Pricing & Inventory</span>
                      {hasVariants && (
                        <span className="px-2 py-0.5 text-[10px] bg-black text-white rounded-md font-semibold">
                          {formVariants.length} Variants
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {hasVariants
                        ? "Standalone price is derived from your variants below."
                        : "Enter direct price, or add multiple variants (sizes, colors)."}
                    </p>
                  </div>

                  {!hasVariants ? (
                    <button
                      type="button"
                      onClick={() => handleAddVariant("Standard", formPrice, formStock || "10")}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs w-full sm:w-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Variants</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleClearAllVariants}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer text-left sm:text-right"
                    >
                      Remove All (Use Single Price)
                    </button>
                  )}
                </div>

                {/* Standalone Price & Stock: Only shown when there are NO variants */}
                {!hasVariants ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                        Price (PKR) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="3499"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        placeholder="25"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black font-semibold"
                      />
                    </div>
                  </div>
                ) : (
                  /* Dynamic Variants Array Builder */
                  <div className="space-y-3 pt-1">
                    {/* Quick Add Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pb-1">
                      <span className="text-[11px] font-semibold text-neutral-500 shrink-0">Presets:</span>
                      <button
                        type="button"
                        onClick={handleQuickAddSizes}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 transition cursor-pointer"
                      >
                        + S, M, L, XL
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddVariant("One Size", formPrice, "25")}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 transition cursor-pointer"
                      >
                        + Free / One Size
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddVariant("", formPrice, "10")}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 transition cursor-pointer flex items-center gap-1 sm:ml-auto"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Custom Variant</span>
                      </button>
                    </div>

                    {/* Variants Rows */}
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
                      {formVariants.map((variant, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white border border-neutral-200 rounded-2xl shadow-xs space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:gap-2.5"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between sm:block mb-1 sm:mb-0.5">
                              <label className="block text-[10px] font-bold uppercase text-neutral-500 tracking-wider">
                                Variant / Size *
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(idx)}
                                className="sm:hidden p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Remove this variant"
                              >
                                <Trash2 className="w-4 h-4 text-rose-500" />
                              </button>
                            </div>
                            <input
                              type="text"
                              required
                              value={variant.label}
                              onChange={(e) => handleUpdateVariant(idx, "label", e.target.value)}
                              placeholder="e.g. Small, M, Red / XL"
                              className="w-full px-3 py-2 sm:py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black font-semibold text-neutral-900"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 shrink-0">
                            <div className="sm:w-28 md:w-32">
                              <label className="block text-[10px] font-bold uppercase text-neutral-500 tracking-wider mb-1 sm:mb-0.5">
                                Price (PKR) *
                              </label>
                              <input
                                type="number"
                                required
                                min="1"
                                value={variant.price || ""}
                                onChange={(e) => handleUpdateVariant(idx, "price", e.target.value)}
                                placeholder="2999"
                                className="w-full px-3 py-2 sm:py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black font-semibold text-neutral-900"
                              />
                            </div>

                            <div className="sm:w-20 md:w-24">
                              <label className="block text-[10px] font-bold uppercase text-neutral-500 tracking-wider mb-1 sm:mb-0.5">
                                Stock *
                              </label>
                              <input
                                type="number"
                                required
                                min="0"
                                value={variant.stock}
                                onChange={(e) => handleUpdateVariant(idx, "stock", e.target.value)}
                                placeholder="10"
                                className="w-full px-3 py-2 sm:py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black font-semibold text-neutral-900"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="hidden sm:flex mt-4 p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0 items-center justify-center"
                            title="Remove this variant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Summary Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs bg-neutral-100/90 px-3.5 py-2.5 rounded-xl text-neutral-700 font-medium">
                      <div className="flex items-center gap-2.5">
                        <span>
                          Variants: <strong className="text-black">{formVariants.length}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Total Stock: <strong className="text-black">{totalVariantStock} units</strong>
                        </span>
                      </div>
                      <div>
                        <span>
                          Base Price:{" "}
                          <strong className="text-black">
                            PKR {minVariantPrice.toLocaleString()}
                            {minVariantPrice !== maxVariantPrice && ` - ${maxVariantPrice.toLocaleString()}`}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Product Image Section */}
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  Product Image
                </label>

                {formImagePreview ? (
                  <div className="relative mb-2.5 flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-neutral-200">
                      <Image
                        src={formImagePreview}
                        alt="Preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-semibold text-neutral-900 truncate">
                        {formSelectedFile ? formSelectedFile.name : "Product Image Selected"}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                        {formSelectedFile ? "Ready to upload" : "Current image"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormSelectedFile(null);
                        setFormImagePreview(null);
                        setFormImage("");
                      }}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded-lg transition"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-2xl cursor-pointer transition border border-dashed border-neutral-300">
                    <Upload className="w-4 h-4 text-neutral-600" />
                    <span>Upload Image from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="mt-2">
                  <input
                    type="text"
                    value={formImage.startsWith("data:") ? "" : formImage}
                    onChange={(e) => {
                      setFormImage(e.target.value);
                      setFormImagePreview(e.target.value);
                      setFormSelectedFile(null);
                    }}
                    placeholder="Or enter direct image URL"
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-xl transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || isUploading}
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold bg-black hover:bg-neutral-800 text-white rounded-xl shadow-xs transition cursor-pointer text-center disabled:opacity-50"
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading Image...</span>
                    </span>
                  ) : isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </span>
                  ) : editingProduct ? (
                    "Save Changes"
                  ) : (
                    "Publish Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
