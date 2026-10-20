import { Headset, Lock, RotateCcw, Truck } from "lucide-react";
import React from "react";

export default function SupportBanner() {
  const supportItems = [
    {
      id: 1,
      title: "Free Shipping",
      subTitle: "On orders over PKR 8000",
      icon: <Truck className="w-6 h-6 md:w-8 md:h-8" />,
    },
    {
      id: 2,
      title: "Cash on Delivery",
      subTitle: "Pay upon doorstep delivery",
      icon: <Lock className="w-6 h-6 md:w-8 md:h-8" />,
    },
    {
      id: 3,
      title: "Easy Size Exchanges",
      subTitle: "Hassle-free shoe size swaps",
      icon: <RotateCcw className="w-6 h-6 md:w-8 md:h-8" />,
    },
    {
      id: 4,
      title: "24/7 Support",
      subTitle: "Always here to help",
      icon: <Headset className="w-6 h-6 md:w-8 md:h-8" />,
    },
  ];

  return (
    <div className="w-full border-y border-neutral-200/80 bg-neutral-50/60 py-8 md:py-10 my-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {supportItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center text-center sm:text-left gap-2.5 sm:gap-4"
          >
            <div className="shrink-0 text-neutral-900">
              {item.icon}
            </div>
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-neutral-900 leading-snug">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 leading-snug">
                {item.subTitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
