'use client';

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  ChevronDown,
  HelpCircle,
  MessageCircle,
} from "lucide-react";

const GOOGLE_MAPS_LINK = "https://maps.app.goo.gl/StWshS4FtdBfUepJ7";

const faqs = [
  {
    question: "How long does delivery take across Pakistan?",
    answer:
      "All footwear and perfume orders are processed within 24 hours. Deliveries within Karachi typically arrive within 1-2 business days. Deliveries to Lahore, Islamabad, Rawalpindi, and other nationwide destinations arrive in 2-4 business days via Leopard and TCS Express.",
  },
  {
    question: "Can I visit the store in Karachi to try shoes before buying?",
    answer:
      "Yes! You are welcome to visit our Karachi flagship store located at Phase 5, 4th Commercial Lane, Zamzama Commercial Area, DHA Phase 5, Karachi. You can test your exact shoe sizing (EUR 39–45) and experience our full perfume tester bar in person.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept Cash on Delivery (COD) for deliveries nationwide. We also accept direct Bank Transfer to our official bank merchant account (via EasyPaisa, JazzCash, SadaPay, NayaPay, or any 1Link bank) with instant order verification.",
  },
  {
    question: "What is your shoe size exchange policy?",
    answer:
      "We offer a 30-day hassle-free size exchange policy. If your loafers, driving moccasins, slides, or sandals do not fit perfectly, contact our team on WhatsApp or visit our store, and we will coordinate an exchange courier pickup right away.",
  },
  {
    question: "How do I choose the correct shoe size before ordering online?",
    answer:
      "Our footwear follows standard EUR / UK sizing (sizes 39 to 45). If you have wider feet or are between sizes, reach out to us on WhatsApp (+92 339 4015589) or Instagram (@bellaro.pk) for personalized fit advice before placing your order.",
  },
  {
    question: "Tell me about Bellaro's Signature Perfumes.",
    answer:
      "Bellaro perfumes are formulated with high-concentration Eau de Parfum (EDP) oils, ensuring exceptional 10+ hour longevity and rich sillage crafted specifically to excel in Pakistan's weather.",
  },
  {
    question: "How can I track my shipment?",
    answer:
      "You can track your order anytime on our dedicated tracking page at /track. Simply enter your Order ID (e.g. #ORD-0001) or the email address used during checkout to view live status updates and courier dispatch details.",
  },
];

export default function ContactPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-8 sm:space-y-12 max-w-full overflow-x-hidden">
      {/* Back to Home */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-neutral-500 hover:text-black transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header */}
      <div className="pb-6 sm:pb-8 border-b border-neutral-200">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-neutral-900 leading-tight">
          Contact &amp; Client Care
        </h1>
        <p className="text-neutral-500 text-xs sm:text-sm md:text-base mt-2 max-w-xl leading-relaxed">
          Have questions about shoe sizing, active courier shipments, or perfume recommendations? Reach out directly via WhatsApp, Instagram, or visit our Karachi store.
        </p>
      </div>

      {/* Official Contact Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full max-w-full">
        {/* WhatsApp Direct */}
        <a
          href="https://wa.me/923394015589?text=Hello%20Bellaro%2C%20I%20have%20an%20inquiry%20regarding%20an%20order"
          target="_blank"
          rel="noopener noreferrer"
          className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex flex-col justify-between gap-3 hover:border-emerald-400 transition group shadow-xs block"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold uppercase">
              Instant
            </span>
          </div>
          <div>
            <h3 className="font-bold text-base text-emerald-950">WhatsApp Support</h3>
            <p className="text-xs text-emerald-700 mt-0.5">Direct chat with our team</p>
            <p className="text-sm font-bold text-emerald-900 mt-2 font-mono group-hover:underline inline-flex items-center gap-1">
              <span>+92 339 4015589</span>
              <span className="text-xs">↗</span>
            </p>
          </div>
        </a>

        {/* Instagram Direct */}
        <a
          href="https://www.instagram.com/bellaro.pk/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-5 bg-rose-50 rounded-2xl border border-rose-200/80 flex flex-col justify-between gap-3 hover:border-rose-400 transition group shadow-xs block"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full font-bold uppercase">
              DM Us
            </span>
          </div>
          <div>
            <h3 className="font-bold text-base text-rose-950">Instagram Official</h3>
            <p className="text-xs text-rose-700 mt-0.5">Drop a message on our page</p>
            <p className="text-sm font-bold text-rose-900 mt-2 font-mono group-hover:underline inline-flex items-center gap-1">
              <span>@bellaro.pk</span>
              <span className="text-xs">↗</span>
            </p>
          </div>
        </a>

        {/* Phone Hotline / Direct Call */}
        <a
          href="tel:+923394015589"
          className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200/80 flex flex-col justify-between gap-3 hover:border-black transition group shadow-xs block"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded-full font-bold uppercase">
              Helpline
            </span>
          </div>
          <div>
            <h3 className="font-bold text-base text-neutral-900">Direct Helpline</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Mon - Sat: 11 AM – 10 PM</p>
            <p className="text-sm font-mono font-bold text-neutral-900 mt-2 group-hover:underline">
              +92 339 4015589
            </p>
          </div>
        </a>

        {/* Physical Store Location Card */}
        <a
          href={GOOGLE_MAPS_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="p-5 bg-neutral-900 text-white rounded-2xl border border-neutral-800 flex flex-col justify-between gap-3 hover:bg-black transition group shadow-md block"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-white text-black flex items-center justify-center shrink-0 shadow-xs">
              <MapPin className="w-6 h-6" />
            </div>
            <span className="text-[10px] bg-neutral-800 text-neutral-300 border border-neutral-700 px-2 py-0.5 rounded-full font-bold uppercase">
              Visit Store
            </span>
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Karachi Showroom</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Zamzama DHA Phase 5</p>
            <p className="text-xs font-bold text-white mt-2 underline group-hover:text-neutral-200 inline-flex items-center gap-1">
              <span>View Location</span>
              <span className="text-xs">↗</span>
            </p>
          </div>
        </a>
      </div>

      {/* Store Location Map Section */}
      <div className="pt-6 sm:pt-8 border-t border-neutral-200 w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full text-xs font-semibold tracking-wider uppercase text-neutral-800 mb-2 border border-neutral-200">
              <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
              <span>Flagship Location • Karachi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-neutral-900">
              Visit The Bellaro Store
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm mt-1 leading-relaxed">
              Experience handcrafted leathers in person, find your exact shoe fit, and explore our full haute perfume bar.
            </p>
          </div>

          <a
            href={GOOGLE_MAPS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-black text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-neutral-800 transition shadow-sm shrink-0 cursor-pointer text-center"
          >
            <Navigation className="w-4 h-4 shrink-0" />
            <span>Get Directions</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5 shrink-0" />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 bg-neutral-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-neutral-200/80 w-full max-w-full overflow-hidden">
          {/* Store Details */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Address</span>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 mt-0.5">
                  Bellaro Footwear &amp; Parfums
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 mt-1 leading-relaxed break-words">
                  Phase 5, 4th Commercial Lane, Zamzama Commercial Area, DHA Phase 5, Karachi, Sindh 75600, Pakistan
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-200/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Opening Hours</span>
                <p className="text-xs sm:text-sm font-semibold text-neutral-900 mt-1">
                  Monday – Saturday: <span className="font-normal text-neutral-700">11:00 AM – 10:00 PM</span>
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Sunday: <span className="text-neutral-700">2:00 PM – 9:00 PM</span>
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-200/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">In-Store Services</span>
                <ul className="text-xs text-neutral-700 space-y-1.5 mt-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                    <span>Full sizing range available (EUR 39 to 45)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                    <span>Live signature Eau de Parfum tester counter</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                    <span>Same-day store pickup &amp; direct size exchanges</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-1">
              <a
                href={GOOGLE_MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-white border border-neutral-300 rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-100 transition shadow-2xs text-center"
              >
                <span>Open in Google Maps App</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          </div>

          {/* Interactive Google Map Embed (Contained & 100% responsive on mobile) */}
          <div className="lg:col-span-7 w-full max-w-full overflow-hidden rounded-xl sm:rounded-2xl border border-neutral-200/80 shadow-xs bg-neutral-200 relative min-h-[260px] sm:min-h-[320px] lg:min-h-[360px] h-full">
            <iframe
              title="Bellaro Karachi Store Location"
              src="https://maps.google.com/maps?q=24.8166111,67.0417222&hl=en&z=17&output=embed"
              className="w-full h-full min-h-[260px] sm:min-h-[320px] lg:min-h-[360px] border-0 block"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions Section */}
      <div className="pt-6 sm:pt-8 border-t border-neutral-200 w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-5 h-5 text-neutral-700 shrink-0" />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-neutral-900">
            Frequently Asked Questions
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-neutral-500 mb-6 max-w-xl">
          Quick answers to common questions regarding store visits, shipping schedules, payment methods, and size exchanges.
        </p>

        <div className="space-y-3 max-w-4xl w-full">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="border border-neutral-200 rounded-2xl overflow-hidden bg-white transition shadow-xs w-full max-w-full"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-neutral-900 text-xs sm:text-sm md:text-base hover:bg-neutral-50/70 transition cursor-pointer"
                >
                  <span className="pr-2">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-black" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 animate-in fade-in duration-150 break-words">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
