'use client';

import React, { useState, useEffect, useTransition, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Edit,
  Eye,
  Minus,
  Package,
  Plus,
  RotateCw,
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
  getAllProductsAction,
} from "@/app/lib/actions/admin";

const FOOTWEAR_COLOR_PRESETS = [
  { name: "White", hex: "#ffffff" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Brown", hex: "#5c4033" },
  { name: "Mustard", hex: "#e1ad01" },
  { name: "Peach", hex: "#fba476" },
  { name: "Black", hex: "#171717" },
  { name: "Dark Brown", hex: "#3e2723" },
  { name: "Tan", hex: "#b87333" },
  { name: "Navy Blue", hex: "#1a2a44" },
  { name: "Olive Green", hex: "#556b2f" },
  { name: "Charcoal Grey", hex: "#4b5563" },
  { name: "Burgundy", hex: "#6b1426" },
];

const getColorHex = (name: string): string => {
  const n = name.toLowerCase();
  const preset = FOOTWEAR_COLOR_PRESETS.find((p) => p.name.toLowerCase() === n);
  if (preset) return preset.hex;
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
  return "#737373";
};

const ADULT_SHOE_SIZES = ["39", "40", "41", "42", "43", "44", "45"];
const ADULT_SIZES_39_44 = ["39", "40", "41", "42", "43", "44"];
const ADULT_SIZES_40_45 = ["40", "41", "42", "43", "44", "45"];
const KIDS_SHOE_SIZES = ["31", "32", "33", "34", "35", "36", "37", "38"];
const PERFUME_BOTTLE_SIZES = ["30ml", "50ml", "100ml", "200ml"];

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

const subCategoryPresets: Record<string, string[]> = {
  Footwear: ["Loafers", "Moccasins", "Slides", "Sandals", "Peshori", "Chappal"],
  Perfumes: ["Eau de Parfum (EDP)", "Extrait de Parfum", "Attar / Fragrance Oil"],
};

export default function ProductsManager({ initialProducts }: ProductsManagerProps) {
  const router = useRouter();
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(new Date());

  // Dynamic existing categories derived from current products (defaults to authentic Bellaro categories: Footwear & Perfumes)
  const existingCategories = useMemo(() => {
    const defaultSet = new Set<string>(["Footwear", "Perfumes"]);
    productsList.forEach((p) => {
      const cat = p.category?.trim();
      if (cat && cat !== "Clothing" && cat !== "Jewelry" && cat !== "Accessories") {
        defaultSet.add(cat);
      }
    });
    return Array.from(defaultSet).sort();
  }, [productsList]);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for Add / Edit
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Footwear");
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [customNewCategory, setCustomNewCategory] = useState("");
  const [formSubCategory, setFormSubCategory] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);
  const [formColors, setFormColors] = useState<string[]>([]);
  const [customColorInput, setCustomColorInput] = useState("");
  const [customVariantInput, setCustomVariantInput] = useState("");
  const [formImages, setFormImages] = useState<{ id: string; url: string; file?: File }[]>([]);
  const [directUrlInput, setDirectUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Derived category & variant calculations
  const isFootwear = formCategory.trim().toLowerCase() === "footwear";
  const isPerfumes = formCategory.trim().toLowerCase() === "perfumes";
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

  // Live auto-refresh products from database
  const refreshProducts = useCallback(async (manual = false) => {
    // If not manual and user is currently typing/editing in a modal, skip background refresh
    if (!manual && (isAddModalOpen || editingProduct)) {
      return;
    }

    if (manual) setIsRefreshing(true);
    try {
      const freshProducts = await getAllProductsAction();
      if (Array.isArray(freshProducts)) {
        setProductsList(freshProducts);
        setLastSyncedTime(new Date());
        if (manual) {
          showToast("Products catalog synchronized with live database", "success");
        }
      }
    } catch (err) {
      console.warn("Products auto-sync error:", err);
      if (manual) {
        showToast("Failed to refresh products", "error");
      }
    } finally {
      if (manual) setIsRefreshing(false);
    }
  }, [isAddModalOpen, editingProduct]);

  // Polling every 8s & re-sync on tab visibility / focus
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshProducts(false);
      }
    }, 8000);

    const onVisibilityOrFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshProducts(false);
      }
    };

    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
    };
  }, [refreshProducts]);

  const [colorFeedback, setColorFeedback] = useState<string | null>(null);

  const handleAddCustomColor = () => {
    const val = customColorInput.trim();
    if (!val) return;
    if (formColors.some((c) => c.toLowerCase() === val.toLowerCase())) {
      setColorFeedback(`"${val}" is already in the list.`);
      setTimeout(() => setColorFeedback(null), 3000);
      return;
    }
    setFormColors((prev) => [...prev, val]);
    setCustomColorInput("");
    setColorFeedback(`Added "${val}" to colors!`);
    setTimeout(() => setColorFeedback(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormDescription("");
    setFormCategory("Footwear");
    setIsCreatingNewCategory(false);
    setCustomNewCategory("");
    setFormSubCategory("");
    setFormPrice("");
    setFormStock("20");
    setFormVariants([]);
    setFormColors(["Black", "Dark Brown"]);
    setCustomColorInput("");
    setCustomVariantInput("");
    setFormImages([]);
    setDirectUrlInput("");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description || "");
    setFormCategory(product.category || "Footwear");
    setIsCreatingNewCategory(false);
    setCustomNewCategory("");
    setFormSubCategory(product.subCategory === "General" ? "" : (product.subCategory || ""));
    setFormPrice(product.price ? product.price.toString() : "");
    setFormStock(product.stock ? product.stock.toString() : "");
    const existingVariants = Array.isArray(product.variants) ? [...product.variants] : [];
    setFormVariants(existingVariants);
    const existingColors = Array.isArray((product as any).colors) ? [...(product as any).colors] : [];
    setFormColors(existingColors);
    setCustomColorInput("");
    setCustomVariantInput("");
    const existingImages: string[] = Array.isArray((product as any).images) && (product as any).images.length > 0
      ? (product as any).images
      : (product.image ? [product.image] : []);
    setFormImages(existingImages.slice(0, 3).map((url, idx) => ({ id: `existing-${idx}-${Date.now()}`, url })));
    setDirectUrlInput("");
    setIsAddModalOpen(true);
  };

  // Base price & stock auto-propagation to variants
  const handleBasePriceChange = (val: string) => {
    const oldPriceNum = Number(formPrice) || 0;
    setFormPrice(val);
    const newPriceNum = Number(val) || 0;
    if (newPriceNum > 0) {
      setFormVariants((prev) =>
        prev.map((v) => ({
          ...v,
          price: v.price === 0 || v.price === oldPriceNum ? newPriceNum : v.price,
        }))
      );
    }
  };

  const handleBaseStockChange = (val: string) => {
    const oldStockNum = Number(formStock) || 10;
    setFormStock(val);
    const newStockNum = Number(val);
    if (!isNaN(newStockNum) && newStockNum >= 0) {
      setFormVariants((prev) =>
        prev.map((v) => ({
          ...v,
          stock: v.stock === 10 || v.stock === oldStockNum ? newStockNum : v.stock,
        }))
      );
    }
  };

  // Variant management handlers
  const toggleSizeVariant = (size: string) => {
    const norm = size.trim();
    const existingIdx = formVariants.findIndex(
      (v) => v.label.toUpperCase().trim() === norm.toUpperCase()
    );
    if (existingIdx >= 0) {
      setFormVariants((prev) => prev.filter((_, i) => i !== existingIdx));
    } else {
      const defaultPrice = Number(formPrice) || 0;
      const defaultStock = Number(formStock) || 10;
      setFormVariants((prev) => [
        ...prev,
        { label: norm, price: defaultPrice, stock: defaultStock },
      ]);
    }
  };

  const handleSelectAdults39to44 = () => {
    const defaultPrice = Number(formPrice) || 0;
    const defaultStock = Number(formStock) || 10;
    setFormVariants((prev) => {
      const existingLabels = new Set(prev.map((v) => v.label.toUpperCase().trim()));
      const toAdd = ADULT_SIZES_39_44
        .filter((s) => !existingLabels.has(s.toUpperCase()))
        .map((s) => ({ label: s, price: defaultPrice, stock: defaultStock }));
      return [...prev, ...toAdd];
    });
  };

  const handleSelectAdults40to45 = () => {
    const defaultPrice = Number(formPrice) || 0;
    const defaultStock = Number(formStock) || 10;
    setFormVariants((prev) => {
      const existingLabels = new Set(prev.map((v) => v.label.toUpperCase().trim()));
      const toAdd = ADULT_SIZES_40_45
        .filter((s) => !existingLabels.has(s.toUpperCase()))
        .map((s) => ({ label: s, price: defaultPrice, stock: defaultStock }));
      return [...prev, ...toAdd];
    });
  };

  const handleSelectAllAdultSizes = () => {
    const defaultPrice = Number(formPrice) || 0;
    const defaultStock = Number(formStock) || 10;
    setFormVariants((prev) => {
      const existingLabels = new Set(prev.map((v) => v.label.toUpperCase().trim()));
      const toAdd = ADULT_SHOE_SIZES
        .filter((s) => !existingLabels.has(s.toUpperCase()))
        .map((s) => ({ label: s, price: defaultPrice, stock: defaultStock }));
      return [...prev, ...toAdd];
    });
  };

  const handleSelectAllKidsSizes = () => {
    const defaultPrice = Number(formPrice) || 0;
    const defaultStock = Number(formStock) || 10;
    setFormVariants((prev) => {
      const existingLabels = new Set(prev.map((v) => v.label.toUpperCase().trim()));
      const toAdd = KIDS_SHOE_SIZES
        .filter((s) => !existingLabels.has(s.toUpperCase()))
        .map((s) => ({ label: s, price: defaultPrice, stock: defaultStock }));
      return [...prev, ...toAdd];
    });
  };

  const handleSelectPerfume50and100 = () => {
    const defaultPrice = Number(formPrice) || 0;
    const defaultStock = Number(formStock) || 10;
    setFormVariants((prev) => {
      const existingLabels = new Set(prev.map((v) => v.label.toUpperCase().trim()));
      const toAdd = ["50ml", "100ml"]
        .filter((s) => !existingLabels.has(s.toUpperCase()))
        .map((s) => ({ label: s, price: defaultPrice, stock: defaultStock }));
      return [...prev, ...toAdd];
    });
  };

  const handleSelectPerfumeAllSizes = () => {
    const defaultPrice = Number(formPrice) || 0;
    const defaultStock = Number(formStock) || 10;
    setFormVariants((prev) => {
      const existingLabels = new Set(prev.map((v) => v.label.toUpperCase().trim()));
      const toAdd = PERFUME_BOTTLE_SIZES
        .filter((s) => !existingLabels.has(s.toUpperCase()))
        .map((s) => ({ label: s, price: defaultPrice, stock: defaultStock }));
      return [...prev, ...toAdd];
    });
  };

  const handleAddCustomVariant = () => {
    const val = customVariantInput.trim();
    if (!val) return;
    const defaultPrice = Number(formPrice) || 0;
    const defaultStock = Number(formStock) || 10;
    if (!formVariants.some((v) => v.label.toUpperCase().trim() === val.toUpperCase())) {
      setFormVariants((prev) => [
        ...prev,
        { label: val, price: defaultPrice, stock: defaultStock },
      ]);
    }
    setCustomVariantInput("");
  };

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

  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 3 - formImages.length;
    if (remaining <= 0) {
      showToast("Maximum 3 pictures allowed per product.", "error");
      e.target.value = "";
      return;
    }

    const acceptedFiles = files.slice(0, remaining);
    if (files.length > remaining) {
      showToast(`Only ${remaining} more picture(s) allowed (maximum 3 total).`, "error");
    }

    const newEntries = acceptedFiles.map((file, idx) => ({
      id: `file-${Date.now()}-${idx}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file,
    }));

    setFormImages((prev) => [...prev, ...newEntries].slice(0, 3));
    e.target.value = "";
  };

  const handleAddDirectUrl = () => {
    const trimmed = directUrlInput.trim();
    if (!trimmed) return;
    if (formImages.length >= 3) {
      showToast("Maximum 3 pictures allowed per product.", "error");
      return;
    }
    setFormImages((prev) => [...prev, { id: `url-${Date.now()}-${Math.random()}`, url: trimmed }].slice(0, 3));
    setDirectUrlInput("");
  };

  const handleRemoveImage = (idToRemove: string) => {
    setFormImages((prev) => prev.filter((img) => img.id !== idToRemove));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setFormImages((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      copy.unshift(selected);
      return copy;
    });
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

    let finalPrice = "";
    let finalStock = "0";

    if (hasVariants) {
      for (let i = 0; i < formVariants.length; i++) {
        const v = formVariants[i];
        if (!v.label.trim()) {
          showToast(`Variant #${i + 1} is missing a name/label.`, "error");
          return;
        }
        if (Number(v.price) <= 0) {
          showToast(`Please enter a price for variant "${v.label}".`, "error");
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
      finalPrice = formPrice.trim();
      finalStock = (formStock || "0").trim();
    }

    setIsUploading(true);
    const finalImageUrls: string[] = [];
    const fallbackFiles: File[] = [];

    // Direct Cloudinary upload from client for each pending file (max 3 pictures)
    for (const entry of formImages) {
      if (entry.file) {
        try {
          const uploadedUrl = await uploadToCloudinaryClient(entry.file);
          if (uploadedUrl) {
            finalImageUrls.push(uploadedUrl);
          } else {
            fallbackFiles.push(entry.file);
          }
        } catch (err) {
          console.warn("Direct upload error, queuing for server upload:", err);
          fallbackFiles.push(entry.file);
        }
      } else if (entry.url && !entry.url.startsWith("blob:")) {
        finalImageUrls.push(entry.url);
      }
    }

    const primaryImageUrl = finalImageUrls[0] || "";

    const formData = new FormData();
    formData.append("name", formName.trim());
    formData.append("description", formDescription.trim());
    formData.append("category", finalCategory);
    formData.append("subCategory", formSubCategory.trim() || "General");
    formData.append("price", finalPrice);
    formData.append("stock", finalStock);
    formData.append("colors", JSON.stringify(formColors));
    formData.append("variants", JSON.stringify(hasVariants ? formVariants : []));
    formData.append("images", JSON.stringify(finalImageUrls.slice(0, 3)));
    formData.append("image", primaryImageUrl);

    // If any file couldn't be uploaded directly on client, send to server
    fallbackFiles.slice(0, 3 - finalImageUrls.length).forEach((f) => {
      formData.append("imageFiles", f);
    });

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
                    image: primaryImageUrl || p.image,
                    images: finalImageUrls.length > 0 ? finalImageUrls : (p as any).images,
                    colors: formColors,
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

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-neutral-700">Auto-Refresh</span>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-400 font-mono text-[11px]" suppressHydrationWarning>
              {lastSyncedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <button
              type="button"
              onClick={() => refreshProducts(true)}
              disabled={isRefreshing}
              className="p-1 hover:bg-neutral-200/60 rounded-md transition text-neutral-500 hover:text-black cursor-pointer"
              title="Click to refresh products now"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-black" : ""}`} />
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
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
                      {(p as any).colors && (p as any).colors.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-200/50 px-1.5 py-0.5 rounded">
                            Colors:
                          </span>
                          {(p as any).colors.map((c: string, ci: number) => (
                            <span
                              key={ci}
                              className="text-[10px] bg-white border border-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-medium"
                            >
                              {c}
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
                            {(p as any).colors && (p as any).colors.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                                  Colors:
                                </span>
                                {(p as any).colors.map((c: string, ci: number) => (
                                  <span
                                    key={ci}
                                    className="text-[10px] bg-neutral-50 border border-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-medium"
                                  >
                                    {c}
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
                  placeholder={
                    formCategory === "Perfumes"
                      ? "e.g. Noir Oud Extrait de Parfum"
                      : "e.g. Monarch Horsebit Loafers in Black Leather"
                  }
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
                  placeholder={
                    formCategory === "Perfumes"
                      ? "Describe top notes, heart notes, base notes, longevity, bottle volume (e.g. 50ml / 100ml)..."
                      : "Describe premium leather grade, insole cushioning, sole material, sizing fit..."
                  }
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
                          setFormCategory(existingCategories.includes("Footwear") ? "Footwear" : existingCategories[0] || "Footwear");
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
                        placeholder="Type new category (e.g. Footwear, Perfumes)..."
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
                          const nextCat = e.target.value;
                          setFormCategory(nextCat);
                          if (!editingProduct) {
                            setFormSubCategory("");
                            if (nextCat.toLowerCase() === "perfumes") {
                              setFormColors([]);
                              setFormVariants([]);
                            } else if (nextCat.toLowerCase() === "footwear") {
                              setFormColors(["White", "Blue", "Brown", "Mustard", "Peach", "Black"]);
                              setFormVariants([]);
                            }
                          }
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
                    placeholder={
                      formCategory === "Perfumes"
                        ? "e.g. Eau de Parfum (EDP), Extrait"
                        : "e.g. Loafers, Moccasins, Slides, Sandals"
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black"
                  />
                  {subCategoryPresets[formCategory] && (
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      <span className="text-[10px] text-neutral-400">Presets:</span>
                      {subCategoryPresets[formCategory].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFormSubCategory(preset)}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-md border transition cursor-pointer ${
                            formSubCategory === preset
                              ? "bg-black text-white border-black font-semibold"
                              : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Color Options Section: Only for Footwear & Non-Perfume Items */}
              {!isPerfumes && (
                <div className="border border-neutral-200 rounded-2xl p-3.5 sm:p-4 bg-white space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                        <span>Shoe &amp; Product Colors</span>
                        {formColors.length > 0 && (
                          <span className="px-2 py-0.5 text-[10px] bg-black text-white rounded-md font-semibold">
                            {formColors.length} Active
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Choose colors below or type a custom color. Active color names are displayed and can be removed at any time.
                      </p>
                    </div>
                    {formColors.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormColors([])}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Active Selected Colors List with Names & Delete Buttons */}
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                        Selected Colors ({formColors.length}):
                      </span>
                      {formColors.length > 0 && (
                        <span className="text-[10px] text-neutral-400">Click ✕ to remove any color</span>
                      )}
                    </div>
                    {formColors.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {formColors.map((colorName) => {
                          const isCustom = !FOOTWEAR_COLOR_PRESETS.some(
                            (p) => p.name.toLowerCase() === colorName.toLowerCase()
                          );
                          const hex = getColorHex(colorName);
                          return (
                            <span
                              key={colorName}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border shadow-2xs transition ${
                                isCustom
                                  ? "bg-amber-50 text-amber-950 border-amber-300"
                                  : "bg-neutral-900 text-white border-neutral-800"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 border ${
                                  colorName.toLowerCase() === "white" ? "border-neutral-300" : "border-black/20"
                                }`}
                                style={{ backgroundColor: hex }}
                              />
                              <span>{colorName}</span>
                              {isCustom && (
                                <span className="text-[9px] font-normal uppercase tracking-wider text-amber-700 bg-amber-100 px-1 py-0.2 rounded">
                                  Custom
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setFormColors(formColors.filter((c) => c !== colorName))}
                                className="p-0.5 hover:opacity-70 rounded-md transition cursor-pointer ml-0.5 text-neutral-400 hover:text-white"
                                title={`Remove ${colorName}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 italic">No colors selected yet. Toggle presets below or add a custom color.</p>
                    )}
                  </div>

                  {/* Preset Quick Toggles */}
                  <div>
                    <span className="block text-[11px] font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">
                      Quick Preset Colors:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {FOOTWEAR_COLOR_PRESETS.map((cp) => {
                        const isSelected = formColors.includes(cp.name);
                        return (
                          <button
                            key={cp.name}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setFormColors(formColors.filter((c) => c !== cp.name));
                              } else {
                                setFormColors([...formColors, cp.name]);
                              }
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                              isSelected
                                ? "bg-black text-white border-black shadow-xs font-semibold"
                                : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                            }`}
                          >
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 border ${
                                cp.name === "White" ? "border-neutral-300" : "border-black/20"
                              }`}
                              style={{ backgroundColor: cp.hex }}
                            />
                            <span>{cp.name}</span>
                            {isSelected && <Check className="w-3 h-3 ml-0.5 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Color Input */}
                  <div className="pt-1 space-y-1.5">
                    <span className="block text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
                      Add Custom Color:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customColorInput}
                        onChange={(e) => setCustomColorInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomColor();
                          }
                        }}
                        placeholder="Type custom color (e.g. Suede Tan, Midnight Blue, Cognac)..."
                        className="flex-1 px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black font-medium"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomColor}
                        className="px-3.5 py-2 bg-black text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition cursor-pointer shrink-0"
                      >
                        + Add Color
                      </button>
                    </div>
                    {colorFeedback && (
                      <p className="text-[11px] font-medium text-emerald-700 animate-in fade-in duration-150">
                        {colorFeedback}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 5. Pricing & Variants Section */}
              <div className="border border-neutral-200 rounded-2xl p-3.5 sm:p-4 bg-neutral-50/70 space-y-3.5">
                {/* Single Price & Stock: Only shown when NO variants are selected */}
                {!hasVariants && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
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
                        className="w-full px-3.5 py-2 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black font-semibold text-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        placeholder="20"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black font-semibold text-neutral-900"
                      />
                    </div>
                  </div>
                )}

                {/* Size Variants Matrix */}
                <div className={`${!hasVariants ? "pt-2 border-t border-neutral-200/80" : ""} space-y-2.5`}>
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                      <span>{isPerfumes ? "Bottle Sizes" : "Shoe Sizes & Variants"}</span>
                      {hasVariants && (
                        <span className="px-2 py-0.5 text-[10px] bg-black text-white rounded-md font-semibold">
                          {formVariants.length} Active
                        </span>
                      )}
                    </span>

                    {/* Presets by Category */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isPerfumes ? (
                        <>
                          <button
                            type="button"
                            onClick={handleSelectPerfume50and100}
                            className="px-2 py-1 text-[11px] font-semibold bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:text-black hover:border-black transition cursor-pointer"
                            title="Add 50ml and 100ml bottles"
                          >
                            + 50ml &amp; 100ml
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSizeVariant("50ml")}
                            className="px-2 py-1 text-[11px] font-semibold bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:text-black hover:border-black transition cursor-pointer"
                          >
                            + 50ml
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSizeVariant("100ml")}
                            className="px-2 py-1 text-[11px] font-semibold bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:text-black hover:border-black transition cursor-pointer"
                          >
                            + 100ml
                          </button>
                          <button
                            type="button"
                            onClick={handleSelectPerfumeAllSizes}
                            className="px-2 py-1 text-[11px] font-semibold bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:text-black hover:border-black transition cursor-pointer"
                            title="Add 30ml, 50ml, 100ml, 200ml"
                          >
                            + All Volumes
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleSelectAdults39to44}
                            className="px-2 py-1 text-[11px] font-semibold bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:text-black hover:border-black transition cursor-pointer"
                            title="Select adult sizes 39 to 44"
                          >
                            + Adults (39–44)
                          </button>
                          <button
                            type="button"
                            onClick={handleSelectAdults40to45}
                            className="px-2 py-1 text-[11px] font-semibold bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:text-black hover:border-black transition cursor-pointer"
                            title="Select adult sizes 40 to 45"
                          >
                            + Adults (40–45)
                          </button>
                          <button
                            type="button"
                            onClick={handleSelectAllKidsSizes}
                            className="px-2 py-1 text-[11px] font-semibold bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:text-black hover:border-black transition cursor-pointer"
                            title="Select kids sizes 31 to 38"
                          >
                            + Kids (31–38)
                          </button>
                        </>
                      )}

                      {hasVariants && (
                        <button
                          type="button"
                          onClick={handleClearAllVariants}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer ml-1"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Size Toggle Chips */}
                  <div className="space-y-2 pt-1">
                    {isPerfumes ? (
                      /* Perfume Bottle Sizes Only */
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-neutral-500 font-medium mr-1 shrink-0">Bottle Sizes:</span>
                        {PERFUME_BOTTLE_SIZES.map((sz) => {
                          const isSelected = formVariants.some(
                            (v) => v.label.toUpperCase().trim() === sz.toUpperCase()
                          );
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => toggleSizeVariant(sz)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? "bg-black text-white border-black shadow-xs font-semibold"
                                  : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      /* Footwear Sizes Only */
                      <>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-neutral-500 font-medium mr-1 shrink-0">Adults (39–45):</span>
                          {ADULT_SHOE_SIZES.map((sz) => {
                            const isSelected = formVariants.some(
                              (v) => v.label.toUpperCase().trim() === sz.toUpperCase()
                            );
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => toggleSizeVariant(sz)}
                                className={`w-9 h-8 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center ${
                                  isSelected
                                    ? "bg-black text-white border-black shadow-xs font-semibold"
                                    : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-neutral-500 font-medium mr-1 shrink-0">Kids (31–38):</span>
                          {KIDS_SHOE_SIZES.map((sz) => {
                            const isSelected = formVariants.some(
                              (v) => v.label.toUpperCase().trim() === sz.toUpperCase()
                            );
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => toggleSizeVariant(sz)}
                                className={`w-8 h-7 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center justify-center ${
                                  isSelected
                                    ? "bg-black text-white border-black shadow-xs font-semibold"
                                    : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Custom Size / Variant Input */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={customVariantInput}
                      onChange={(e) => setCustomVariantInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomVariant();
                        }
                      }}
                      placeholder={
                        isPerfumes
                          ? "Add custom bottle size (e.g. 10ml, 150ml)..."
                          : "Add custom shoe size (e.g. 46, One Size)..."
                      }
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:border-black font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomVariant}
                      className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Compact, Ultra-clean Variant Table (Shown only when variants exist) */}
                  {hasVariants && (
                    <div className="mt-3 border border-neutral-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                      <div className="grid grid-cols-[64px_1fr_1fr_32px] sm:grid-cols-[80px_1fr_1fr_36px] bg-neutral-100/90 px-2.5 py-1.5 text-[10px] font-bold text-neutral-600 uppercase tracking-wider border-b border-neutral-200">
                        <div>Size</div>
                        <div>Price (PKR)</div>
                        <div>Stock</div>
                        <div className="text-right">✕</div>
                      </div>
                      <div className="divide-y divide-neutral-100 max-h-56 overflow-y-auto">
                        {formVariants.map((variant, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-[64px_1fr_1fr_32px] sm:grid-cols-[80px_1fr_1fr_36px] items-center gap-1.5 px-2.5 py-1.5 hover:bg-neutral-50/50"
                          >
                            <input
                              type="text"
                              value={variant.label}
                              onChange={(e) => handleUpdateVariant(idx, "label", e.target.value)}
                              className="w-full px-2 py-1 text-xs font-bold text-neutral-900 bg-neutral-100 border border-transparent hover:border-neutral-300 rounded-lg focus:bg-white focus:border-black text-center"
                            />
                            <input
                              type="number"
                              min="1"
                              value={variant.price || ""}
                              onChange={(e) => handleUpdateVariant(idx, "price", e.target.value)}
                              placeholder={formPrice || "0"}
                              className="w-full px-2 py-1 text-xs font-semibold text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:border-black"
                            />
                            <input
                              type="number"
                              min="0"
                              value={variant.stock !== undefined ? variant.stock : ""}
                              onChange={(e) => handleUpdateVariant(idx, "stock", e.target.value)}
                              placeholder={formStock || "10"}
                              className="w-full px-2 py-1 text-xs font-semibold text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:border-black"
                            />
                            <div className="text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(idx)}
                                className="p-1 text-neutral-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                                title="Remove variant"
                              >
                                <Trash2 className="w-3.5 h-3.5 mx-auto" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] bg-neutral-50 px-3 py-1.5 text-neutral-600 font-medium border-t border-neutral-200">
                        <span>
                          Variants: <strong className="text-black">{formVariants.length}</strong> • Total Stock:{" "}
                          <strong className="text-black">{totalVariantStock} units</strong>
                        </span>
                        <span>
                          Price:{" "}
                          <strong className="text-black">
                            PKR {minVariantPrice.toLocaleString()}
                            {minVariantPrice !== maxVariantPrice && ` - ${maxVariantPrice.toLocaleString()}`}
                          </strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Product Images Section (Max 3 Pictures) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-700">
                      Product Pictures (Max 3 Allowed)
                    </label>
                    <p className="text-[11px] text-neutral-400">
                      Upload up to 3 angles (Cover, side angle, detail). 1st picture is the catalog cover.
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      formImages.length === 3 ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {formImages.length} / 3 Uploaded
                  </span>
                </div>

                {/* 3 Picture Slots Grid */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {[0, 1, 2].map((slotIdx) => {
                    const img = formImages[slotIdx];
                    const isPrimary = slotIdx === 0;

                    if (img) {
                      return (
                        <div
                          key={img.id}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-2 bg-neutral-50 flex flex-col items-center justify-center group ${
                            isPrimary ? "border-black shadow-xs ring-2 ring-black/10" : "border-neutral-200"
                          }`}
                        >
                          <Image
                            src={img.url}
                            alt={`Product preview ${slotIdx + 1}`}
                            fill
                            unoptimized
                            className="object-contain p-1"
                          />
                          {/* Slot Label Badge */}
                          <div className="absolute top-1.5 left-1.5 z-10">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-xs ${
                                isPrimary
                                  ? "bg-black text-white"
                                  : "bg-white/90 backdrop-blur-xs text-neutral-700 border border-neutral-200"
                              }`}
                            >
                              {isPrimary ? "Cover" : `Pic ${slotIdx + 1}`}
                            </span>
                          </div>

                          {/* Hover Actions: Remove & Set Cover */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-between p-2 z-10">
                            <div className="w-full flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(img.id)}
                                className="p-1 bg-white/90 hover:bg-white text-rose-600 rounded-lg shadow-xs transition cursor-pointer"
                                title="Remove this picture"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(slotIdx)}
                                className="w-full py-1 text-[10px] font-bold bg-white text-black hover:bg-neutral-100 rounded-lg shadow-xs transition cursor-pointer text-center"
                              >
                                Make Cover
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Empty Slot
                    return (
                      <label
                        key={`empty-${slotIdx}`}
                        className="relative aspect-square rounded-2xl border-2 border-dashed border-neutral-300 hover:border-black bg-neutral-50/60 hover:bg-neutral-100/60 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition group"
                      >
                        <div className="p-2 bg-white rounded-full border border-neutral-200 shadow-2xs group-hover:scale-105 transition mb-1 text-neutral-400 group-hover:text-black">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-600 group-hover:text-black">
                          {slotIdx === 0 ? "+ Cover Photo" : `+ Picture ${slotIdx + 1}`}
                        </span>
                        <span className="text-[9px] text-neutral-400">Click to add</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple={formImages.length < 2}
                          onChange={handleImageFilesChange}
                          className="hidden"
                        />
                      </label>
                    );
                  })}
                </div>

                {/* Direct Image URL input & Batch Upload Button */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border border-neutral-200 transition ${
                      formImages.length >= 3
                        ? "bg-neutral-100 text-neutral-400 cursor-not-allowed border-dashed"
                        : "bg-white hover:bg-neutral-50 text-neutral-800 cursor-pointer shadow-2xs"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formImages.length >= 3 ? "Max 3 Pictures Reached" : "Select Device Pictures (Max 3)"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={formImages.length >= 3}
                      onChange={handleImageFilesChange}
                      className="hidden"
                    />
                  </label>

                  <div className="flex gap-1.5 flex-1">
                    <input
                      type="text"
                      value={directUrlInput}
                      disabled={formImages.length >= 3}
                      onChange={(e) => setDirectUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddDirectUrl();
                        }
                      }}
                      placeholder={formImages.length >= 3 ? "Max 3 pictures reached" : "Or enter direct image URL..."}
                      className="flex-1 px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-black disabled:bg-neutral-100 disabled:text-neutral-400"
                    />
                    <button
                      type="button"
                      disabled={formImages.length >= 3 || !directUrlInput.trim()}
                      onClick={handleAddDirectUrl}
                      className="px-3 py-2 text-xs font-semibold bg-neutral-900 text-white rounded-xl hover:bg-black disabled:bg-neutral-200 disabled:text-neutral-400 transition cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>
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
