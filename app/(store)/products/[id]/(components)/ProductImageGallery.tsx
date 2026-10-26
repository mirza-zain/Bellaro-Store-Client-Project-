'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageGalleryProps {
  images: string[];
  name: string;
}

export default function ProductImageGallery({ images, name }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const displayImages = images && images.length > 0 ? images.slice(0, 3) : ["/images/img1.jpg"];
  const currentImage = displayImages[selectedIndex] || displayImages[0];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  // Keyboard left/right arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (displayImages.length <= 1) return;
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [displayImages.length]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    setTouchStartX(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Image Viewport */}
      <div
        className="relative aspect-square md:aspect-[4/5] w-full rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xs group flex items-center justify-center select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Ambient blurred backdrop that matches image colors */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Image
            src={currentImage}
            alt=""
            fill
            className="object-cover scale-125 blur-2xl opacity-35 brightness-95"
            priority
          />
        </div>

        {/* Foreground full product image: zero cropping, click-through */}
        <div className="relative w-full h-full z-10 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
          <Image
            src={currentImage}
            alt={`${name} - View ${selectedIndex + 1}`}
            fill
            className="object-contain transition duration-300 drop-shadow-xs"
            priority
          />
        </div>

        {/* Prev / Next Chevrons: High z-index (z-30) & always clickable */}
        {displayImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/95 hover:bg-white text-neutral-900 shadow-lg backdrop-blur-xs transition z-30 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 pointer-events-none" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/95 hover:bg-white text-neutral-900 shadow-lg backdrop-blur-xs transition z-30 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-5 h-5 pointer-events-none" />
            </button>
          </>
        )}

        {/* Counter Pill */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-semibold backdrop-blur-xs z-20 pointer-events-none">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-3">
          {displayImages.map((imgUrl, index) => {
            const isActive = index === selectedIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedIndex(index);
                }}
                className={`relative w-20 h-20 rounded-2xl overflow-hidden bg-neutral-100 transition cursor-pointer border-2 shrink-0 ${
                  isActive
                    ? "border-black ring-2 ring-black/20 scale-102 opacity-100"
                    : "border-neutral-200 hover:border-neutral-400 opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={imgUrl}
                  alt={`${name} thumbnail ${index + 1}`}
                  fill
                  className="object-cover object-center pointer-events-none"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
