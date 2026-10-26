'use client';

import { Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useCart } from "@/app/context/CartContext";

export default function Navbar() {
  const { totalItems, isLoaded, openDrawer } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

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
      <nav className="relative w-full py-3.5 md:py-4.5 flex justify-between items-center px-4 md:px-10 z-50 bg-white border-b border-neutral-100 shadow-xs">
        {/* Brand Logo */}
        <div className="md:mx-2">
          <Link href="/" className="group flex items-center gap-3">
            <Image
              src="/images/logo-transparent.png"
              alt="Bellaro Official Logo"
              width={48}
              height={48}
              className="h-10 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 uppercase group-hover:text-neutral-700 transition leading-none">
                Bellaro
              </span>
              <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-neutral-400 mt-1">
                Footwear &bull; Parfums
              </span>
            </div>
          </Link>
        </div>

        {/* Clean Desktop Navigation: Home | Footwear | Perfumes | Track | Contact */}
        <div className="hidden md:flex">
          <ul className="flex justify-center items-center gap-8 lg:gap-10">
            <li className="text-sm font-semibold uppercase tracking-wider text-neutral-800 hover:text-black transition">
              <Link href="/">Home</Link>
            </li>
            <li className="text-sm font-semibold uppercase tracking-wider text-neutral-800 hover:text-black transition">
              <Link href="/products?category=Footwear">Footwear</Link>
            </li>
            <li className="text-sm font-semibold uppercase tracking-wider text-neutral-800 hover:text-black transition">
              <Link href="/products?category=Perfumes">Perfumes</Link>
            </li>
            <li className="text-sm font-semibold uppercase tracking-wider text-neutral-800 hover:text-black transition">
              <Link href="/track">Track</Link>
            </li>
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

        {/* Clean Full-screen Mobile Menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between p-6 md:hidden overflow-y-auto">
            {/* Mobile Menu Header */}
            <div className="flex justify-between items-center w-full pb-4 border-b border-neutral-100">
              <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5">
                <Image
                  src="/images/logo-transparent.png"
                  alt="Bellaro Logo"
                  width={38}
                  height={38}
                  className="h-9 w-auto object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-2xl font-extrabold uppercase tracking-tight text-neutral-950 leading-none">Bellaro</span>
                  <span className="text-[9px] font-semibold tracking-widest uppercase text-neutral-400 mt-1">
                    Footwear &bull; Parfums
                  </span>
                </div>
              </Link>
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openDrawer();
                  }}
                  className="relative p-1"
                  aria-label="Cart"
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
                  className="cursor-pointer p-1"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={26} />
                </button>
              </div>
            </div>

            {/* Clean Mobile Links */}
            <div className="flex flex-col items-center justify-center flex-1 my-8 w-full">
              <ul className="flex flex-col items-center gap-7 text-center w-full">
                <li>
                  <Link
                    href="/"
                    onClick={() => setMenuOpen(false)}
                    className="text-2xl font-bold tracking-wider uppercase hover:opacity-70 transition-opacity"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products?category=Footwear"
                    onClick={() => setMenuOpen(false)}
                    className="text-2xl font-bold tracking-wider uppercase hover:opacity-70 transition-opacity"
                  >
                    Footwear
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products?category=Perfumes"
                    onClick={() => setMenuOpen(false)}
                    className="text-2xl font-bold tracking-wider uppercase hover:opacity-70 transition-opacity"
                  >
                    Perfumes
                  </Link>
                </li>
                <li>
                  <Link
                    href="/track"
                    onClick={() => setMenuOpen(false)}
                    className="text-2xl font-bold tracking-wider uppercase hover:opacity-70 transition-opacity"
                  >
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    onClick={() => setMenuOpen(false)}
                    className="text-2xl font-bold tracking-wider uppercase hover:opacity-70 transition-opacity"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Mobile Footer */}
            <div className="pt-4 border-t border-neutral-100 text-center text-xs text-neutral-400">
              <p>Handcrafted Footwear &amp; Signature Parfums</p>
              <p className="mt-1 font-semibold text-neutral-700">Karachi, Pakistan</p>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
