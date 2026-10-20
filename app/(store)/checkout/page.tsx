'use client';

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  FileText,
  Lock,
  Package,
  ShieldCheck,
  Smartphone,
  Tag,
  Trash2,
  Truck,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import {
  createOrderAction,
  validateDiscountCodeAction,
} from "@/app/lib/actions/checkout";
import { useCart } from "@/app/context/CartContext";
import { ShippingRule } from "@/app/db/schema";
import { getShippingRulesAction } from "@/app/lib/actions/shipping";
import { computeShippingFee } from "@/app/lib/shippingUtils";

const COUNTRY_CODES = [
  { code: "+92", country: "PK", flag: "🇵🇰", label: "Pakistan (+92)" },
  { code: "+1", country: "US", flag: "🇺🇸", label: "United States (+1)" },
  { code: "+44", country: "GB", flag: "🇬🇧", label: "United Kingdom (+44)" },
  { code: "+971", country: "AE", flag: "🇦🇪", label: "UAE (+971)" },
  { code: "+966", country: "SA", flag: "🇸🇦", label: "Saudi Arabia (+966)" },
  { code: "+968", country: "OM", flag: "🇴🇲", label: "Oman (+968)" },
  { code: "+974", country: "QA", flag: "🇶🇦", label: "Qatar (+974)" },
  { code: "+965", country: "KW", flag: "🇰🇼", label: "Kuwait (+965)" },
  { code: "+973", country: "BH", flag: "🇧🇭", label: "Bahrain (+973)" },
  { code: "+1", country: "CA", flag: "🇨🇦", label: "Canada (+1)" },
  { code: "+61", country: "AU", flag: "🇦🇺", label: "Australia (+61)" },
  { code: "+49", country: "DE", flag: "🇩🇪", label: "Germany (+49)" },
  { code: "+90", country: "TR", flag: "🇹🇷", label: "Turkey (+90)" },
  { code: "+60", country: "MY", flag: "🇲🇾", label: "Malaysia (+60)" },
  { code: "+86", country: "CN", flag: "🇨🇳", label: "China (+86)" },
  { code: "+91", country: "IN", flag: "🇮🇳", label: "India (+91)" },
];

const COUNTRIES_LIST = [
  { code: "PK", name: "Pakistan", flag: "🇵🇰", dialCode: "+92" },
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", dialCode: "+971" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", dialCode: "+966" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { code: "OM", name: "Oman", flag: "🇴🇲", dialCode: "+968" },
  { code: "QA", name: "Qatar", flag: "🇶🇦", dialCode: "+974" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", dialCode: "+965" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭", dialCode: "+973" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49" },
  { code: "TR", name: "Turkey", flag: "🇹🇷", dialCode: "+90" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", dialCode: "+60" },
  { code: "CN", name: "China", flag: "🇨🇳", dialCode: "+86" },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { code: "Other", name: "Other Country", flag: "🌐", dialCode: "" },
];

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

async function uploadToCloudinaryClient(file: File, folder: string = "bazzario/payments"): Promise<string | null> {
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
    if (folder) {
      formData.append("folder", folder);
    }

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.secure_url || data.url || null;
  } catch (err) {
    console.error("Client upload error:", err);
    return null;
  }
}

export default function CheckoutPage() {
  const { items, clearCart, isLoaded } = useCart();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "Karachi",
    country: "Pakistan",
    postalCode: "",
    notes: "",
  });

  const [countryCode, setCountryCode] = useState("+92");
  const [customCity, setCustomCity] = useState("");
  const [customCountry, setCustomCountry] = useState("");

  const handleCountryChange = (selectedCountry: string) => {
    setFormData((prev) => ({
      ...prev,
      country: selectedCountry,
      // If switching to an international country, clear default Karachi selection
      city: selectedCountry === "Pakistan" ? "Karachi" : "",
    }));
    const match = COUNTRIES_LIST.find((c) => c.name === selectedCountry);
    if (match && match.dialCode) {
      setCountryCode(match.dialCode);
    }
    if (selectedCountry !== "Pakistan" && paymentMethod === "cod") {
      setPaymentMethod("bank_transfer");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strictly accept only numbers (0-9) and prevent exceeding 11 digits
    const cleanedDigits = e.target.value.replace(/\D/g, "").slice(0, 11);
    setFormData((prev) => ({ ...prev, phone: cleanedDigits }));
  };
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank_transfer">("cod");
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountFeedback, setDiscountFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);
  const [placedOrderCode, setPlacedOrderCode] = useState<string | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState(false);
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCopyTrackingId = (trackingId: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(trackingId);
      setCopiedTrackingId(true);
      setTimeout(() => setCopiedTrackingId(false), 2000);
    }
  };

  const handleCopyBankField = (text: string, fieldKey: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBankField(fieldKey);
      setTimeout(() => setCopiedBankField(null), 2000);
    }
  };

  // Load live shipping rules
  React.useEffect(() => {
    getShippingRulesAction()
      .then((rules) => {
        if (rules && rules.length > 0) setShippingRules(rules);
      })
      .catch((err) => console.error("Error fetching shipping rules on checkout:", err));
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);

  const effectiveCity = formData.city === "Other" ? (customCity.trim() || "Other") : formData.city;
  const shippingCalculation = React.useMemo(() => {
    return computeShippingFee(subtotal, effectiveCity, shippingRules);
  }, [subtotal, effectiveCity, shippingRules]);

  const shippingFee = shippingCalculation.fee;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setIsValidatingCode(true);
    setDiscountFeedback(null);

    startTransition(async () => {
      const res = await validateDiscountCodeAction(promoCode, subtotal);
      setIsValidatingCode(false);
      if (res.valid && res.discountPercent) {
        setDiscountPercent(res.discountPercent);
        setAppliedCode(res.code || promoCode.trim().toUpperCase());
        setDiscountFeedback({
          type: "success",
          message: `Code ${res.code} applied! ${res.discountPercent}% discount added.`,
        });
      } else {
        setDiscountFeedback({
          type: "error",
          message: res.error || "Invalid discount code.",
        });
      }
    });
  };

  const handleRemovePromo = () => {
    setDiscountPercent(0);
    setAppliedCode(null);
    setPromoCode("");
    setDiscountFeedback(null);
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit. Please upload an image under 10MB.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setScreenshotPreview(localUrl);
    setPaymentProof(localUrl);
    setIsUploadingScreenshot(true);

    try {
      const uploadedUrl = await uploadToCloudinaryClient(file, "bazzario/payments");
      if (uploadedUrl) {
        setPaymentProof(uploadedUrl);
      } else {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          setPaymentProof(uploadEvent.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn("Screenshot upload error, fallback to data URL:", err);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setPaymentProof(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedFirstName = formData.firstName.trim();
    const trimmedLastName = formData.lastName.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedAddress = formData.address.trim();
    const phoneDigits = formData.phone.replace(/\D/g, "");

    // Strict Billing & Shipping Field Validation (cannot go empty)
    if (!trimmedFirstName) {
      setErrorMessage("First Name is required. Please provide your first name.");
      return;
    }

    if (!trimmedLastName) {
      setErrorMessage("Last Name is required. Please provide your last name.");
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage("Email Address is required to send your order confirmation and invoice.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address (e.g. name@example.com).");
      return;
    }

    if (!phoneDigits) {
      setErrorMessage("Phone Number is required for delivery courier coordination.");
      return;
    }

    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setErrorMessage("Phone number must be between 10 and 11 digits (e.g. 03001234567 or 3001234567). It cannot exceed 11 digits.");
      return;
    }

    if (!trimmedAddress || trimmedAddress.length < 5) {
      setErrorMessage("Please enter a complete delivery address (street, house / flat #) so courier can deliver your order.");
      return;
    }

    const effectiveCountry = formData.country === "Other Country" ? (customCountry.trim() || "Other") : formData.country;

    if (formData.country === "Other Country" && !customCountry.trim()) {
      setErrorMessage("Please enter your country name.");
      return;
    }

    if (!effectiveCity.trim()) {
      setErrorMessage("Please enter your city name.");
      return;
    }

    if (formData.country === "Pakistan" && formData.city === "Other" && !customCity.trim()) {
      setErrorMessage("Please enter the name of your city or town.");
      return;
    }

    if (paymentMethod === "bank_transfer" && isUploadingScreenshot) {
      setErrorMessage("Please wait a moment while your payment screenshot finishes uploading...");
      return;
    }

    if (paymentMethod === "bank_transfer" && !paymentProof) {
      setErrorMessage("Please upload a screenshot of your payment transfer before placing the order.");
      return;
    }

    if (paymentMethod === "cod" && (effectiveCountry.toLowerCase() !== "pakistan" || effectiveCity.toLowerCase() !== "karachi")) {
      setErrorMessage("Cash on Delivery (COD) is currently only available for deliveries within Karachi, Pakistan. Please select Bank Transfer.");
      return;
    }

    const fullName = `${trimmedFirstName} ${trimmedLastName}`.trim();
    const formattedPhone = `${countryCode} ${phoneDigits}`;

    startTransition(async () => {
      const res = await createOrderAction({
        customerName: fullName,
        customerEmail: trimmedEmail,
        phone: formattedPhone,
        address: trimmedAddress,
        city: effectiveCity,
        country: effectiveCountry,
        totalAmount: grandTotal,
        paymentMethod,
        paymentProof: paymentProof || undefined,
        discountCode: appliedCode || undefined,
        discountAmount,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          variant: i.variant,
          image: i.image,
        })),
      });

      if (res.success && res.orderId) {
        clearCart();
        setPlacedOrderId(res.orderId);
        if (res.orderCode) {
          setPlacedOrderCode(res.orderCode);
        }
        try {
          const trackingCode = res.orderCode || `BAZ-${res.orderId.toString().padStart(4, "0")}`;
          const newOrderData = {
            orderId: res.orderId,
            formattedId: trackingCode,
            customerName: fullName,
            email: trimmedEmail,
            phone: formattedPhone,
            productIds: items.map((i) => i.productId),
            timestamp: Date.now(),
          };
          const existingRaw = localStorage.getItem("bazzario_recent_orders");
          let existingOrders: any[] = [];
          if (existingRaw) {
            try {
              existingOrders = JSON.parse(existingRaw);
            } catch {}
          }
          const updated = [newOrderData, ...existingOrders.filter((o: any) => o.orderId !== res.orderId)].slice(0, 10);
          localStorage.setItem("bazzario_recent_orders", JSON.stringify(updated));
          localStorage.setItem("bazzario_last_order", JSON.stringify(newOrderData));
        } catch (err) {
          console.error("Failed saving recent order to localStorage", err);
        }
      } else {
        setErrorMessage(res.error || "Failed to place order.");
      }
    });
  };

  if (!placedOrderId && !isLoaded) {
    return (
      <div className="w-full max-w-2xl mx-auto px-5 py-24 text-center">
        <div className="inline-block w-8 h-8 border-3 border-neutral-300 border-t-black rounded-full animate-spin mb-3" />
        <p className="text-sm text-neutral-500">Preparing checkout session...</p>
      </div>
    );
  }

  if (!placedOrderId && isLoaded && items.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto px-5 py-16 text-center">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
          <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Your Cart is Empty
          </h1>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            You don&apos;t have any items in your checkout session. Explore our catalog and add items to your cart to complete an order.
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-block px-8 py-3.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (placedOrderId) {
    const trackingCode = placedOrderCode || `BAZ-${placedOrderId.toString().padStart(4, "0")}`;
    return (
      <div className="w-full max-w-2xl mx-auto px-5 py-16 text-center">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
            Order Placed Successfully!
          </h1>

          <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 inline-flex flex-col items-center gap-1.5 shadow-xs">
            <span className="text-xs uppercase font-semibold text-neutral-400 tracking-wider">Unique Tracking Code</span>
            <div className="flex items-center gap-2.5">
              <p className="text-2xl sm:text-3xl font-mono font-bold text-neutral-900 tracking-tight">{trackingCode}</p>
              <button
                type="button"
                onClick={() => handleCopyTrackingId(trackingCode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition shadow-xs active:scale-95 cursor-pointer"
                title="Copy Tracking ID"
              >
                {copiedTrackingId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-neutral-400">Save this unique code to trace your package anytime</p>
          </div>

          <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
            Thank you, <span className="font-semibold text-neutral-900">{formData.firstName}</span>! We have sent confirmation details to{" "}
            <span className="font-medium text-neutral-900">{formData.email}</span>.{" "}
            {paymentMethod === "bank_transfer" ? (
              <span className="text-emerald-700 font-medium block mt-1">
                Your payment screenshot has been uploaded. Our admin team will verify it shortly and dispatch your package!
              </span>
            ) : (
              <span>Your order will be dispatched via express courier with Cash on Delivery.</span>
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link
              href={`/track?orderId=${encodeURIComponent(trackingCode)}`}
              className="px-6 py-3.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition"
            >
              Track Order Status
            </Link>
            <Link
              href="/products"
              className="px-6 py-3.5 bg-neutral-100 text-neutral-800 text-sm font-semibold rounded-xl hover:bg-neutral-200 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-5 md:px-12 py-10">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shopping Bag</span>
        </Link>
      </div>

      <div className="pb-8 border-b border-neutral-200">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-neutral-900">
          Checkout
        </h1>
        <p className="text-neutral-500 text-sm md:text-base mt-1">
          Complete your delivery and payment details to confirm your order.
        </p>
      </div>

      {errorMessage && (
        <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10">
        {/* Left Form: Shipping & Payment (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section 1: Customer Contact */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h2 className="text-lg font-bold text-neutral-900">1. Contact Information</h2>
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                * Required Fields
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1.5">
                  Email Address <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:ring-1 focus:ring-black transition"
                />
                <p className="text-[11px] text-neutral-400 mt-1">Invoice and order tracking will be emailed here</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase">
                    Phone Number (For Courier) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      formData.phone.length === 11
                        ? "text-emerald-600 font-semibold"
                        : formData.phone.length > 0
                        ? "text-neutral-500"
                        : "text-neutral-400"
                    }`}
                  >
                    {formData.phone.length}/11 digits
                  </span>
                </div>

                <div className="flex rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black transition shadow-2xs">
                  {/* Country Code Selector */}
                  <div className="relative shrink-0 border-r border-neutral-200 bg-neutral-100/80">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="h-full pl-3 pr-7 py-3 bg-transparent text-xs sm:text-sm font-semibold text-neutral-800 focus:outline-hidden cursor-pointer appearance-none"
                      aria-label="Select Country Code"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={`${c.country}-${c.code}`} value={c.code}>
                          {c.flag} {c.code} ({c.country})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-neutral-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Phone Digits Input */}
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10,11}"
                    required
                    maxLength={11}
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="03001234567"
                    className="flex-1 min-w-0 px-4 py-3 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden font-mono"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 flex items-center justify-between">
                  <span>Max 11 digits (e.g. 03001234567)</span>
                  <span className="font-medium text-neutral-700">Format: {countryCode} {formData.phone || "XXXXXXXXXXX"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h2 className="text-lg font-bold text-neutral-900">2. Billing & Shipping Address</h2>
              <span className="text-xs text-neutral-400">
                All details required for courier delivery
              </span>
            </div>

            {/* Country / Region Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1.5">
                Country / Region <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={formData.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full pl-4 pr-9 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:ring-1 focus:ring-black transition appearance-none cursor-pointer font-medium text-neutral-900"
                >
                  {COUNTRIES_LIST.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {formData.country === "Other Country" && (
                <div className="mt-2.5">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                    Country Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customCountry}
                    onChange={(e) => setCustomCountry(e.target.value)}
                    placeholder="Type your country name (e.g. France, Singapore, Japan)..."
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:ring-1 focus:ring-black transition"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1.5">
                  First Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Ali"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:ring-1 focus:ring-black transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1.5">
                  Last Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Khan"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:ring-1 focus:ring-black transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1.5">
                Street Address & House / Flat # <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="House # 12-B, Street 4, Sector F-7/2"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:ring-1 focus:ring-black transition"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Provide accurate street name, apartment or house number
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1.5">
                  City <span className="text-rose-500 font-bold">*</span>
                </label>
                {formData.country === "Pakistan" ? (
                  <>
                    <div className="relative">
                      <select
                        required
                        value={formData.city}
                        onChange={(e) => {
                          const newCity = e.target.value;
                          setFormData((prev) => ({ ...prev, city: newCity }));
                          if (newCity.toLowerCase() !== "karachi" && paymentMethod === "cod") {
                            setPaymentMethod("bank_transfer");
                          }
                        }}
                        className="w-full pl-4 pr-9 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:ring-1 focus:ring-black transition appearance-none cursor-pointer"
                      >
                        <option value="Karachi">Karachi</option>
                        <option value="Lahore">Lahore</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="Rawalpindi">Rawalpindi</option>
                        <option value="Faisalabad">Faisalabad</option>
                        <option value="Multan">Multan</option>
                        <option value="Peshawar">Peshawar</option>
                        <option value="Quetta">Quetta</option>
                        <option value="Other">Other City / Town</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>

                    {formData.city === "Other" && (
                      <div className="mt-2.5">
                        <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                          City / Town Name <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={customCity}
                          onChange={(e) => setCustomCity(e.target.value)}
                          placeholder="Type your city or town name (e.g. Sialkot, Hyderabad, Abbottabad)..."
                          className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:ring-1 focus:ring-black transition"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <input
                      type="text"
                      required
                      value={formData.city === "Karachi" ? "" : formData.city}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({ ...prev, city: val }));
                        setCustomCity(val);
                      }}
                      placeholder="e.g. London, Dubai, New York, Riyadh"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:ring-1 focus:ring-black transition"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1.5">
                  Postal Code (Optional)
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="75500"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:ring-1 focus:ring-black transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1.5">
                Special Delivery Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Ring doorbell twice, deliver in evening..."
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black focus:ring-1 focus:ring-black transition resize-none"
              />
            </div>
          </div>

          {/* Section 3: Payment Option */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900">3. Payment Option</h2>
              <span className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-full">
                {paymentMethod === "cod" ? "Pay on Delivery" : "Manual Transfer"}
              </span>
            </div>

            {/* Payment Method Notice */}
            {formData.country !== "Pakistan" ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>International Shipping Note:</strong> Cash on Delivery (COD) is strictly available within Karachi, Pakistan. For international delivery to <strong>{formData.country === "Other" ? (customCountry || "selected country") : formData.country}</strong>, please complete payment via Direct Bank Transfer.
                </span>
              </div>
            ) : formData.city.toLowerCase() !== "karachi" ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> Cash on Delivery (COD) is exclusively available for deliveries within <strong>Karachi</strong>. For shipments to <strong>{formData.city}</strong>, please complete payment via Direct Bank Transfer or EasyPaisa.
                </span>
              </div>
            ) : null}

            <div className="space-y-3">
              {/* COD Option */}
              {formData.country === "Pakistan" && formData.city.toLowerCase() === "karachi" ? (
                <label
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === "cod"
                      ? "border-black bg-neutral-50 ring-1 ring-black"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="accent-black w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-neutral-900">
                          Cash on Delivery (COD)
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Karachi Only
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">Pay cash directly to courier at your doorstep</span>
                    </div>
                  </div>
                  <Truck className="w-5 h-5 text-neutral-400 shrink-0" />
                </label>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/70 opacity-60 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      disabled
                      checked={false}
                      className="accent-black w-4 h-4 cursor-not-allowed"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-neutral-500">
                          Cash on Delivery (COD)
                        </span>
                        <span className="text-[10px] bg-neutral-200 text-neutral-600 font-bold px-2 py-0.5 rounded-full">
                          Unavailable
                        </span>
                      </div>
                      <span className="text-xs text-neutral-400">
                        {formData.country !== "Pakistan"
                          ? "Unavailable for international shipping (Karachi, Pakistan only)"
                          : "Only available for addresses in Karachi"}
                      </span>
                    </div>
                  </div>
                  <Truck className="w-5 h-5 text-neutral-300 shrink-0" />
                </div>
              )}

              {/* Bank Transfer / Wallet Option */}
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === "bank_transfer"
                    ? "border-black bg-neutral-50 ring-1 ring-black"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "bank_transfer"}
                    onChange={() => setPaymentMethod("bank_transfer")}
                    className="accent-black w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-sm text-neutral-900 block">
                      Direct Bank Transfer / EasyPaisa / JazzCash
                    </span>
                    <span className="text-xs text-neutral-500">
                      Transfer to our account & upload screenshot of payment
                    </span>
                  </div>
                </div>
                <Building2 className="w-5 h-5 text-neutral-400 shrink-0" />
              </label>
            </div>

            {/* Bank Transfer Details & Screenshot Upload Form */}
            {paymentMethod === "bank_transfer" && (
              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Official Payment Account Details</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Please transfer the exact total amount (
                    <span className="font-bold text-neutral-900">PKR {grandTotal.toLocaleString()}</span>
                    ) to any of the following accounts:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Bank Option */}
                  <div className="p-3.5 bg-white rounded-xl border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between font-semibold text-neutral-800">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-neutral-600" />
                        <span className="font-bold text-neutral-900">Bank AL Habib</span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-medium text-neutral-600">Official Account</span>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-neutral-100">
                      <div>
                        <span className="text-[11px] text-neutral-400 block">Account Title</span>
                        <span className="text-neutral-900 font-semibold text-xs">Kamran Dawood</span>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <div>
                          <span className="text-[11px] text-neutral-400 block">Account Number</span>
                          <span className="text-neutral-900 font-mono font-semibold select-all text-xs">1082-0078-011366-01-0</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyBankField("10820078011366010", "acc")}
                          className="px-2 py-1 text-[11px] font-medium rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition flex items-center gap-1 shrink-0"
                          title="Copy Account Number"
                        >
                          {copiedBankField === "acc" ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-neutral-500" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <div>
                          <span className="text-[11px] text-neutral-400 block">IBAN (Universal)</span>
                          <span className="text-neutral-900 font-mono text-[11px] select-all">PK89BAHL1082007801136601</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyBankField("PK89BAHL1082007801136601", "iban")}
                          className="px-2 py-1 text-[11px] font-medium rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition flex items-center gap-1 shrink-0"
                          title="Copy IBAN"
                        >
                          {copiedBankField === "iban" ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-neutral-500" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="text-[11px] text-neutral-500 pt-0.5">
                        <span>Branch: </span>
                        <span className="text-neutral-700 font-medium">Garden West, Karachi (Code 1082)</span>
                      </div>
                    </div>
                  </div>

                  {/* Transfer Guide Card */}
                  <div className="p-3.5 bg-white rounded-xl border border-neutral-200 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between font-semibold text-neutral-800">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-bold text-neutral-900">EasyPaisa / JazzCash / Mobile App</span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-medium">Instant IBFT</span>
                      </div>

                      <div className="space-y-1.5 pt-1.5 border-t border-neutral-100 text-neutral-600 text-[11px] leading-relaxed">
                        <p>
                          <span className="font-semibold text-neutral-800">1.</span> Open EasyPaisa, JazzCash, SadaPay, Nayapay, or your banking app.
                        </p>
                        <p>
                          <span className="font-semibold text-neutral-800">2.</span> Choose <span className="font-semibold text-neutral-800">Send Money → Bank Transfer</span>.
                        </p>
                        <p>
                          <span className="font-semibold text-neutral-800">3.</span> Select <span className="font-semibold text-neutral-800">Bank AL Habib</span> & paste the account or IBAN.
                        </p>
                        <p>
                          <span className="font-semibold text-neutral-800">4.</span> Verify title is <span className="font-semibold text-neutral-900">Kamran Dawood</span>, complete payment, and upload the receipt screenshot below.
                        </p>
                      </div>
                    </div>

                    <div className="p-2 bg-emerald-50/70 rounded-lg border border-emerald-100 text-[11px] text-emerald-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Verified merchant account. Instant dispatch upon approval.</span>
                    </div>
                  </div>
                </div>

                {/* Screenshot Upload Field */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-800 uppercase">
                    Upload Payment Screenshot (Receipt) *
                  </label>

                  {isUploadingScreenshot && (
                    <div className="flex items-center gap-2.5 p-3 bg-neutral-100 rounded-xl text-xs text-neutral-700 animate-pulse border border-neutral-200">
                      <Loader2 className="w-4 h-4 animate-spin text-black shrink-0" />
                      <span>Uploading payment receipt to secure storage...</span>
                    </div>
                  )}

                  {paymentProof ? (
                    <div className="relative p-3 bg-white rounded-xl border border-emerald-300 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-neutral-200 shrink-0">
                          <Image
                            src={screenshotPreview || paymentProof}
                            alt="Payment Screenshot"
                            fill
                            className="object-cover"
                            unoptimized={Boolean(screenshotPreview && screenshotPreview.startsWith("blob:"))}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {isUploadingScreenshot ? "Uploading..." : "Screenshot Attached"}
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            {isUploadingScreenshot ? "Optimizing receipt image..." : "Ready for admin verification"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentProof(null);
                          setScreenshotPreview(null);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Remove screenshot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-neutral-300 hover:border-black rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-white group">
                      <Upload className="w-6 h-6 text-neutral-400 group-hover:text-black mb-2 transition" />
                      <span className="text-xs font-semibold text-neutral-800">
                        Click or drag to upload receipt screenshot
                      </span>
                      <span className="text-[11px] text-neutral-400 mt-0.5">
                        PNG, JPG, JPEG, WEBP up to 10MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Order Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-50 p-6 sm:p-8 rounded-3xl border border-neutral-200 space-y-6">
            <h2 className="text-lg font-bold text-neutral-900 pb-3 border-b border-neutral-200">
              Order Items ({items.length})
            </h2>

            {/* Items Mini List */}
            <div className="divide-y divide-neutral-200 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                    <Image src={item.image || "/images/img1.jpg"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <span>Qty: {item.quantity}</span>
                      {item.variant && (
                        <span className="font-medium text-neutral-700">• {item.variant}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 shrink-0">
                    PKR {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Promo Code Box */}
            <div className="pt-2 border-t border-neutral-200 space-y-2">
              {appliedCode ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Coupon: {appliedCode} (-{discountPercent}%)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-neutral-400 hover:text-neutral-800 text-xs font-semibold p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Discount code (e.g. BAZAAR10)"
                    className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs uppercase focus:outline-hidden focus:border-black font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={isValidatingCode || !promoCode.trim()}
                    className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
                  >
                    {isValidatingCode ? "Checking..." : "Apply"}
                  </button>
                </div>
              )}

              {discountFeedback && (
                <p
                  className={`text-xs ${
                    discountFeedback.type === "success" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {discountFeedback.message}
                </p>
              )}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2.5 text-sm pt-3 border-t border-neutral-200">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>PKR {subtotal.toLocaleString()}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount ({discountPercent}%)</span>
                  <span>- PKR {discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-start text-neutral-600">
                <div>
                  <span className="font-medium text-neutral-800">Shipping</span>
                  {shippingCalculation.isFree ? (
                    <span className="text-[11px] text-emerald-600 font-medium block">
                      Free shipping qualified (&ge; PKR {shippingCalculation.freeThreshold.toLocaleString()})
                    </span>
                  ) : (
                    <span className="text-[11px] text-neutral-400 block">
                      {shippingCalculation.rateType === "city"
                        ? `${shippingCalculation.matchedCity} express rate`
                        : "Standard delivery rate"}
                    </span>
                  )}
                </div>
                <span className={`font-semibold ${shippingFee === 0 ? "text-emerald-600" : "text-neutral-900"}`}>
                  {shippingFee === 0 ? "FREE" : `PKR ${shippingFee.toLocaleString()}`}
                </span>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-between text-lg font-bold text-neutral-900">
                <span>Total Amount</span>
                <span>PKR {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-black hover:bg-neutral-800 text-white font-semibold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isPending ? "Placing Order..." : "Confirm & Place Order"}</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Encrypted & secure checkout</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

