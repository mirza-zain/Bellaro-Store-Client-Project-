'use client';

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Send,
  ChevronDown,
  AlertCircle,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import { submitInquiryAction } from "@/app/lib/actions/inquiries";

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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await submitInquiryAction(formData);
      if (res.success) {
        setSubmitted(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setErrorMessage(res.error || "Failed to send message. Please try again.");
      }
    });
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-5 md:px-12 py-10 space-y-12">
      {/* Back to Home */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header */}
      <div className="pb-8 border-b border-neutral-200">
        <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-neutral-900">
          Contact & Client Care
        </h1>
        <p className="text-neutral-500 text-sm md:text-base mt-2 max-w-xl">
          Have questions about shoe sizing, active courier shipments, or perfume recommendations? The Bellaro Karachi team is here to assist you.
        </p>
      </div>

      {/* Main Grid: Channels + Contact Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact Info Channels (1 col) */}
        <div className="space-y-4">
          {/* Instagram Direct */}
          <a
            href="https://www.instagram.com/bellaro.pk/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 bg-rose-50 rounded-2xl border border-rose-200/80 flex items-start gap-4 hover:border-rose-400 transition group block shadow-xs"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-rose-950">Instagram Official</h3>
                <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full font-bold uppercase">
                  DM Us
                </span>
              </div>
              <p className="text-xs text-rose-700 mt-0.5">Drop a message on our official page</p>
              <p className="text-sm font-bold text-rose-900 mt-2 font-mono group-hover:underline inline-flex items-center gap-1">
                <span>@bellaro.pk</span>
                <span className="text-xs">↗</span>
              </p>
            </div>
          </a>

          {/* WhatsApp Direct */}
          <a
            href="https://wa.me/923394015589?text=Hello%20Bellaro%2C%20I%20have%20an%20inquiry%20regarding%20an%20order"
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-start gap-4 hover:border-emerald-400 transition group block shadow-xs"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-emerald-950">WhatsApp Support</h3>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold uppercase">
                  Instant
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">Direct chat with our Karachi team</p>
              <p className="text-sm font-bold text-emerald-900 mt-2 font-mono group-hover:underline inline-flex items-center gap-1">
                <span>+92 339 4015589</span>
                <span className="text-xs">↗</span>
              </p>
            </div>
          </a>

          {/* Phone Hotline / Direct Call */}
          <a
            href="tel:+923394015589"
            className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200/80 flex items-start gap-4 hover:border-black transition group block"
          >
            <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-neutral-900">Direct Helpline</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Mon - Sat from 10:00 AM to 8:00 PM</p>
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
            className="p-6 bg-neutral-900 text-white rounded-2xl border border-neutral-800 flex items-start gap-4 hover:bg-black transition group block shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center shrink-0 shadow-xs">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-white">Karachi Store</h3>
                <span className="text-[10px] bg-neutral-800 text-neutral-300 border border-neutral-700 px-2 py-0.5 rounded-full font-bold uppercase">
                  Visit Us
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">Phase 5, 4th Commercial Lane</p>
              <p className="text-xs text-neutral-300 mt-0.5 font-medium">Zamzama, DHA Phase 5, Karachi</p>
              <p className="text-xs font-bold text-white mt-2.5 underline group-hover:text-neutral-200 inline-flex items-center gap-1">
                <span>View on Google Maps</span>
                <span className="text-xs">↗</span>
              </p>
            </div>
          </a>
        </div>

        {/* Contact Form (2 cols) */}
        <div className="lg:col-span-2 bg-white p-8 sm:p-10 rounded-3xl border border-neutral-200 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-5 h-5 text-neutral-700" />
            <h2 className="text-2xl font-bold text-neutral-900">Send an Inquiry</h2>
          </div>
          <p className="text-sm text-neutral-500 mb-6">
            Fill in your details and message below. We will follow up via email promptly.
          </p>

          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {submitted ? (
            <div className="p-10 bg-emerald-50 rounded-3xl border border-emerald-200 text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-950">Message Sent Successfully!</h3>
              <p className="text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
                Thank you for reaching out to Bellaro. We have logged your inquiry and our customer care team will respond to your email address shortly.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-3 bg-black text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition cursor-pointer"
                >
                  Send Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Zain Malik"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. zain@example.com"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Size advice for Monarch Loafers / Order inquiry"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1.5">
                  Message *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please describe how we can assist you..."
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-black transition"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white font-semibold text-sm rounded-xl hover:bg-neutral-800 transition cursor-pointer shadow-sm w-full sm:w-auto disabled:opacity-60"
              >
                <span>{isPending ? "Sending Inquiry..." : "Submit Inquiry"}</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Store Location Map Section */}
      <div className="pt-8 border-t border-neutral-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full text-xs font-semibold tracking-wider uppercase text-neutral-800 mb-2 border border-neutral-200">
              <MapPin className="w-3.5 h-3.5 text-black" />
              <span>Flagship Location • Karachi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-neutral-900">
              Visit The Bellaro Store
            </h2>
            <p className="text-neutral-500 text-sm md:text-base mt-1 max-w-xl">
              Experience handcrafted leathers in person, find your exact shoe fit, and explore our full haute perfume bar at our Zamzama location.
            </p>
          </div>

          <a
            href={GOOGLE_MAPS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition shadow-sm shrink-0 cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>Get Directions on Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-neutral-50 rounded-3xl p-6 sm:p-8 border border-neutral-200/80">
          {/* Store Details */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Address</span>
                <h3 className="text-lg font-bold text-neutral-900 mt-1">
                  Bellaro Footwear & Parfums
                </h3>
                <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
                  Phase 5, 4th Commercial Lane, Zamzama Commercial Area, DHA Phase 5, Karachi, Sindh 75600, Pakistan
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-200/60">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Opening Hours</span>
                <p className="text-sm font-semibold text-neutral-900 mt-1">
                  Monday – Saturday: <span className="font-normal text-neutral-700">11:00 AM – 10:00 PM</span>
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Sunday: <span className="text-neutral-700">2:00 PM – 9:00 PM</span>
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-200/60">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">In-Store Services</span>
                <ul className="text-xs text-neutral-700 space-y-2 mt-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                    <span>Try on full sizing range (EUR 39 to 45)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                    <span>Live signature Eau de Parfum tester counter</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                    <span>Same-day in-store pickup & direct exchanges</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={GOOGLE_MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-white border border-neutral-300 rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-100 transition shadow-2xs"
              >
                <span>Open Pin in Google Maps App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Interactive Google Map Embed */}
          <div className="lg:col-span-7 relative aspect-16/10 lg:aspect-auto lg:h-full min-h-[320px] rounded-2xl overflow-hidden border border-neutral-200 shadow-xs bg-neutral-200">
            <iframe
              title="Bellaro Karachi Store Location"
              src="https://maps.google.com/maps?q=24.8166111,67.0417222&hl=en&z=17&output=embed"
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions Section */}
      <div className="pt-8 border-t border-neutral-200">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-5 h-5 text-neutral-700" />
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-neutral-900">
            Frequently Asked Questions
          </h2>
        </div>
        <p className="text-sm text-neutral-500 mb-8 max-w-xl">
          Quick answers to common questions regarding store visits, shipping schedules, payment methods, and size exchanges.
        </p>

        <div className="space-y-3 max-w-4xl">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="border border-neutral-200 rounded-2xl overflow-hidden bg-white transition shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-neutral-900 text-sm sm:text-base hover:bg-neutral-50/70 transition cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-black" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 animate-in fade-in duration-150">
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
