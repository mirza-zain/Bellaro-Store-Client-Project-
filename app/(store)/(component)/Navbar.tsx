'use client';

import { ChevronDown, Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useCart } from "@/app/context/CartContext";

const footwearCategories = [
  {
    name: "Loafers & Formals",
    href: "/products?category=Footwear&subCategory=Loafers",
    desc: "Horsebit, Lug-Sole & Penny Loafers",
  },
  {
    name: "Driving Moccasins",
    href: "/products?category=Footwear&subCategory=Moccasins",
    desc: "Suede & Leather Driving Slip-Ons",
  },
  {
    name: "Crisscross Slides",
    href: "/products?category=Footwear&subCategory=Slides",
    desc: "Designer Cross-Strap Slides",
  },
  {
    name: "Buckle Sandals",
    href: "/products?category=Footwear&subCategory=Sandals",
    desc: "Dual-Strap Contoured Chappals",
  },
  {
    name: "Cushioned Flip-Flops",
    href: "/products?category=Footwear&subCategory=Flip-Flops",
    desc: "Ergonomic Daily Foam Footbeds",
  },
];

export default function Navbar() {
  const { totalItems, isLoaded, openDrawer } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [footwearDropdownOpen, setFootwearDropdownOpen] = useState(false);
  const [mobileFootwearOpen, setMobileFootwearOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="relative w-full py-3 md:py-4 flex justify-between items-center px-4 md:px-10 z-50 bg-white border-b border-neutral-100 shadow-xs">
        {/* Brand Logo */}
        <div className="md:mx-2">
          <Link href="/" className="group flex items-center gap-3">
            <Image
              src="/images/logo-transparent.png"
              alt="Bellaro Official Logo"
              width={48}
              height={48}
              className="h-11 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 uppercase group-hover:text-neutral-700 transition leading-none">
                Bellaro
              </span>
              <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-neutral-400 mt-1">
                Step Into Style • Parfums
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Menu: Home, Footwear (dropdown), Perfumes, Track, Contact */}
        <div className="hidden md:flex">
          <ul className="flex justify-center items-center gap-8 lg:gap-10">
            <li className="text-sm font-semibold uppercase tracking-wider text-neutral-800 hover:text-black transition">
              <Link href="/">Home</Link>
            </li>

            {/* Footwear with Mega Dropdown */}
            <li
              className="relative py-2"
              onMouseEnter={() => setFootwearDropdownOpen(true)}
              onMouseLeave={() => setFootwearDropdownOpen(false)}
            >
              <Link
                href="/products?category=Footwear"
                className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-neutral-800 hover:text-black transition cursor-pointer"
              >
                <span>Footwear</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    footwearDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </Link>

              {/* Footwear Dropdown Menu */}
              {footwearDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[380px] bg-white rounded-2xl shadow-2xl border border-neutral-100 p-5 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="border-b border-neutral-100 pb-2 mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                      Footwear Categories
                    </span>
                    <Link
                      href="/products?category=Footwear"
                      onClick={() => setFootwearDropdownOpen(false)}
                      className="text-[11px] font-semibold text-black hover:underline"
                    >
                      View All →
                    </Link>
                  </div>

                  <ul className="space-y-1.5">
                    {footwearCategories.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={() => setFootwearDropdownOpen(false)}
                          className="group/item flex flex-col px-3 py-2 rounded-xl hover:bg-neutral-50 transition"
                        >
                          <span className="text-sm font-bold text-neutral-900 group-hover/item:text-black">
                            {item.name}
                          </span>
                          <span className="text-xs text-neutral-400 group-hover/item:text-neutral-600">
                            {item.desc}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 pt-3 border-t border-neutral-100 bg-neutral-50 -mx-5 -mb-5 p-3 px-5 rounded-b-2xl flex justify-between items-center text-xs">
                    <span className="text-neutral-500 text-[11px]">Handcrafted in Karachi</span>
                    <a
                      href="https://www.instagram.com/bellaro.pk/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-black hover:underline inline-flex items-center gap-1"
                    >
                      <span>@bellaro.pk</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              )}
            </li>

            {/* Perfumes */}
            <li className="text-sm font-semibold uppercase tracking-wider text-neutral-800 hover:text-black transition">
              <Link href="/products?category=Perfumes">Perfumes</Link>
            </li>

            {/* Track Order */}
            <li className="text-sm font-semibold uppercase tracking-wider text-neutral-800 hover:text-black transition">
              <Link href="/track">Track</Link>
            </li>

            {/* Contact */}
            <li className="text-sm font-semibold uppercase tracking-wider text-neutral-800 hover:text-black transition">
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </div>

        {/* Action Icons */}
        <div className="flex justify-center items-center gap-6 md:gap-8 md:mx-2">
          <button
            type="button"
            onClick={openDrawer}
            aria-label="Cart"
            className="relative p-1 hover:opacity-70 transition-opacity cursor-pointer"
          >
            <ShoppingBag size={24} />
            {isLoaded && totalItems > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-black text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </button>
          <button
            type="button"
            className="md:hidden cursor-pointer"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={25} />
          </button>
        </div>

        {/* Full-screen Mobile Menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between p-6 md:hidden overflow-y-auto">
            {/* Mobile Menu Header */}
            <div className="flex justify-between items-center w-full pb-4 border-b border-neutral-100">
              <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5">
                <Image
                  src="/images/logo-transparent.png"
                  alt="Bellaro Logo"
                  width={40}
                  height={40}
                  className="h-10 w-auto object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-2xl font-extrabold uppercase tracking-tight text-neutral-950 leading-none">Bellaro</span>
                  <span className="text-[9px] font-semibold tracking-widest uppercase text-neutral-400 mt-1">
                    Step Into Style • Parfums
                  </span>
                </div>
              </Link>
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openDrawer();
                  }}
                  aria-label="Cart"
                  className="relative cursor-pointer"
                >
                  <ShoppingBag size={25} />
                  {isLoaded && totalItems > 0 && (
                    <span className="absolute -top-1 -right-1.5 bg-black text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {totalItems > 99 ? "99+" : totalItems}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className="cursor-pointer p-1"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={28} />
                </button>
              </div>
            </div>

            {/* Navigation Links with Accordion for Footwear */}
            <div className="flex flex-col items-center justify-center flex-1 my-6 w-full">
              <ul className="flex flex-col items-center gap-5 text-center w-full max-w-sm">
                <li>
                  <Link
                    href="/"
                    onClick={() => setMenuOpen(false)}
                    className="text-xl font-bold tracking-wider uppercase hover:opacity-70 transition-opacity"
                  >
                    Home
                  </Link>
                </li>

                {/* Footwear Mobile Accordion */}
                <li className="w-full">
                  <button
                    type="button"
                    onClick={() => setMobileFootwearOpen(!mobileFootwearOpen)}
                    className="flex items-center justify-center gap-2 text-xl font-bold tracking-wider uppercase w-full py-1 hover:opacity-70 transition-opacity cursor-pointer"
                  >
                    <span>Footwear</span>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform duration-200 ${
                        mobileFootwearOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {mobileFootwearOpen && (
                    <div className="mt-3 p-4 bg-neutral-50 rounded-2xl space-y-2 text-left border border-neutral-200/60">
                      {footwearCategories.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="block py-2 px-3 rounded-lg hover:bg-neutral-100 transition"
                        >
                          <span className="block text-xs font-bold text-neutral-900 uppercase tracking-wider">
                            {item.name}
                          </span>
                          <span className="block text-[11px] text-neutral-500 mt-0.5">
                            {item.desc}
                          </span>
                        </Link>
                      ))}
                      <div className="pt-2 border-t border-neutral-200 text-center">
                        <Link
                          href="/products?category=Footwear"
                          onClick={() => setMenuOpen(false)}
                          className="text-xs font-bold text-black underline"
                        >
                          View All Footwear →
                        </Link>
                      </div>
                    </div>
                  )}
                </li>

                <li>
                  <Link
                    href="/products?category=Perfumes"
                    onClick={() => setMenuOpen(false)}
                    className="text-xl font-bold tracking-wider uppercase hover:opacity-70 transition-opacity"
                  >
                    Perfumes
                  </Link>
                </li>

                <li>
                  <Link
                    href="/track"
                    onClick={() => setMenuOpen(false)}
                    className="text-xl font-bold tracking-wider uppercase hover:opacity-70 transition-opacity"
                  >
                    Track Order
                  </Link>
                </li>

                <li>
                  <Link
                    href="/contact"
                    onClick={() => setMenuOpen(false)}
                    className="text-xl font-bold tracking-wider uppercase hover:opacity-70 transition-opacity"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Mobile Menu Footer */}
            <div className="text-center text-xs text-neutral-400 pb-2 border-t border-neutral-100 pt-3 space-y-1">
              <a
                href="https://www.instagram.com/bellaro.pk/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-neutral-800 hover:underline block"
              >
                Follow us on Instagram: @bellaro.pk ↗
              </a>
              <p>© 2026 Bellaro PK. Step Into Style.</p>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
