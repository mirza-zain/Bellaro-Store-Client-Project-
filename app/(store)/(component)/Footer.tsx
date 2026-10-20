'use client';

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight, Mail, MapPin, Phone, ShieldCheck, Truck, RotateCcw } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  if (pathname === "/checkout") {
    return (
      <footer className="w-full py-6 mt-8 text-center text-xs text-neutral-500 border-t border-neutral-200">
        <p className="flex items-center justify-center gap-1.5 font-medium text-neutral-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>256-Bit Encrypted Secure Checkout • Helpline: +92 339 4015589</span>
        </p>
        <p className="mt-1">© 2026 Bellaro PK. Step Into Style.</p>
      </footer>
    );
  }
  return (
    <footer className="w-full bg-neutral-900 text-white rounded-3xl mt-16 overflow-hidden">
      {/* Top Value Proposition Bar */}
      <div className="border-b border-neutral-800 py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Free Express Shipping</h4>
              <p className="text-xs text-neutral-400 mt-0.5">On all orders over PKR 8,000</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">30-Day Easy Returns</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Hassle-free exchanges & returns</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">100% Authentic Quality</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Guaranteed premium craftsmanship</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info & Newsletter */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo-white.png"
                alt="Bellaro Official Logo"
                width={50}
                height={50}
                className="h-12 w-auto object-contain brightness-95"
              />
              <div className="flex flex-col">
                <h3 className="text-3xl font-extrabold tracking-tight uppercase leading-none">Bellaro</h3>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-neutral-400 mt-1">
                  Footwear & Parfums • Karachi
                </span>
              </div>
            </div>
            <p className="text-neutral-400 text-sm max-w-sm leading-relaxed">
              Handcrafted in Karachi. Renowned for luxury horsebit loafers, driving moccasins, designer cross-strap slides, and long-lasting artisanal perfumes.
            </p>

            <div className="pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                Join the Bellaro VIP Circle
              </p>
              {subscribed ? (
                <div className="p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-emerald-400 font-medium">
                  ✓ Thank you for subscribing to Bellaro VIP Circle!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-white transition"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-xl hover:bg-neutral-200 transition shrink-0 cursor-pointer"
                  >
                    Join
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Column 1: Shop */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Collections</h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <Link href="/products?category=Footwear&subCategory=Loafers" className="hover:text-white transition">Loafers & Formals</Link>
              </li>
              <li>
                <Link href="/products?category=Footwear&subCategory=Moccasins" className="hover:text-white transition">Driving Moccasins</Link>
              </li>
              <li>
                <Link href="/products?category=Footwear&subCategory=Slides" className="hover:text-white transition">Cross-Strap Slides</Link>
              </li>
              <li>
                <Link href="/products?category=Footwear&subCategory=Flip-Flops" className="hover:text-white transition">Cushioned Flip-Flops</Link>
              </li>
              <li>
                <Link href="/products?category=Perfumes" className="hover:text-white transition">Signature Perfumes</Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition">All Products</Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Customer Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Customer Support</h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <Link href="/track" className="hover:text-white transition">Track Your Order</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">Contact & Helpline</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">Shoe Sizing Guide</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">Exchange & Returns</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Details & Instagram */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Connect with Us</h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <a
                  href="https://www.instagram.com/bellaro.pk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition flex items-center gap-1.5 font-medium text-white"
                >
                  <span>Instagram: @bellaro.pk</span>
                  <span className="text-xs">↗</span>
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="tel:+923394015589" className="hover:text-white transition font-mono">
                  +92 339 4015589
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                <a
                  href="https://maps.app.goo.gl/StWshS4FtdBfUepJ7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition inline-flex items-center gap-1"
                >
                  <span>Zamzama, DHA Phase 5, Karachi</span>
                  <span className="text-xs">↗</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Payment Bar */}
      <div className="border-t border-neutral-800 py-6 px-6 md:px-12 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Bellaro PK. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3 text-neutral-300 font-medium">
            <span>Cash on Delivery</span>
            <span>•</span>
            <span>Visa</span>
            <span>•</span>
            <span>Mastercard</span>
            <span>•</span>
            <span>Bank Transfer / EasyPaisa</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

