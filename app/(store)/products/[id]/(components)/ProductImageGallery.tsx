'use client';

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageGalleryProps {
  images: string[];
  name: string;
}

export default function ProductImageGallery({ images, name }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const displayImages = images && images.length > 0 ? images.slice(0, 3) : ["/images/img1.jpg"];
  const currentImage = displayImages[selectedIndex] || displayImages[0];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Image Viewport */}
      <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-neutral-50/60 border border-neutral-200/80 shadow-xs group flex items-center justify-center">
        <Image
          src={currentImage}
          alt={`${name} - View ${selectedIndex + 1}`}
          fill
          className="object-contain p-2 sm:p-3 transition duration-300"
          priority
        />

        {/* Prev / Next Chevrons (Only if multiple pictures exist) */}
        {displayImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-neutral-800 shadow-md backdrop-blur-xs transition opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-neutral-800 shadow-md backdrop-blur-xs transition opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Counter Pill */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-semibold backdrop-blur-xs">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails Row (Only if more than 1 image) */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-3">
          {displayImages.map((imgUrl, index) => {
            const isActive = index === selectedIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`relative w-20 h-20 rounded-2xl overflow-hidden bg-neutral-50 transition cursor-pointer border-2 flex items-center justify-center ${
                  isActive
                    ? "border-black ring-2 ring-black/20 scale-102"
                    : "border-neutral-200 hover:border-neutral-400 opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={imgUrl}
                  alt={`${name} thumbnail ${index + 1}`}
                  fill
                  className="object-contain p-1"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
