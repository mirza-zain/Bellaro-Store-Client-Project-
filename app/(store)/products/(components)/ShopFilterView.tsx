'use client';

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Filter,
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Check,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  Tag,
  DollarSign,
  Package,
} from "lucide-react";
import { Product } from "@/app/db/schema";

interface ShopFilterViewProps {
  initialProducts: Product[];
  initialCategory?: string;
  initialSubCategory?: string;
  initialSearch?: string;
}

export default function ShopFilterView({
  initialProducts,
  initialCategory = "all",
  initialSubCategory = "all",
  initialSearch = "",
}: ShopFilterViewProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState(initialSubCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceBracket, setPriceBracket] = useState<"all" | "under-3000" | "3000-6000" | "over-6000">("all");

  // Filter Drawer & Sidebar visibility state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const catalogTopRef = useRef<HTMLDivElement>(null);

  // Dynamic unique categories with counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    initialProducts.forEach((p) => {
      const cat = p.category;
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    const uniqueCats = Object.keys(counts).sort();
    return [
      { name: "all", label: "All Categories", count: initialProducts.length },
      ...uniqueCats.map((cat) => ({ name: cat, label: cat, count: counts[cat] })),
    ];
  }, [initialProducts]);

  // Filtered categories for category search
  const visibleCategories = useMemo(() => {
    if (!categorySearch.trim()) return categoriesWithCounts;
    const q = categorySearch.toLowerCase();
    return categoriesWithCounts.filter(
      (c) => c.name === "all" || c.label.toLowerCase().includes(q)
    );
  }, [categoriesWithCounts, categorySearch]);

  // Subcategories for current category selection
  const availableSubCategories = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.subCategory) {
        if (
          selectedCategory === "all" ||
          p.category.toLowerCase() === selectedCategory.toLowerCase()
        ) {
          set.add(p.subCategory);
        }
      }
    });
    return Array.from(set).sort();
  }, [selectedCategory, initialProducts]);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Subcategory filter
    if (selectedSubCategory !== "all") {
      result = result.filter(
        (p) => p.subCategory.toLowerCase() === selectedSubCategory.toLowerCase()
      );
    }

    // In-Stock Only filter
    if (inStockOnly) {
      result = result.filter((p) => Number(p.stock) > 0);
    }

    // Price bracket filter
    if (priceBracket === "under-3000") {
      result = result.filter((p) => Number(p.price) < 3000);
    } else if (priceBracket === "3000-6000") {
      result = result.filter((p) => Number(p.price) >= 3000 && Number(p.price) <= 6000);
    } else if (priceBracket === "over-6000") {
      result = result.filter((p) => Number(p.price) > 6000);
    }

    // Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.subCategory && p.subCategory.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === "price-asc") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "in-stock") {
      result.sort((a, b) => Number(b.stock) - Number(a.stock));
    } else {
      // "featured": newest first (by id desc)
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [
    initialProducts,
    selectedCategory,
    selectedSubCategory,
    inStockOnly,
    priceBracket,
    searchQuery,
    sortBy,
  ]);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSubCategory, searchQuery, sortBy, inStockOnly, priceBracket, itemsPerPage]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));

  // Current page products slice
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (selectedSubCategory !== "all") count++;
    if (searchQuery.trim() !== "") count++;
    if (sortBy !== "featured") count++;
    if (inStockOnly) count++;
    if (priceBracket !== "all") count++;
    return count;
  }, [selectedCategory, selectedSubCategory, searchQuery, sortBy, inStockOnly, priceBracket]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSubCategory("all");
  };

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSelectedSubCategory("all");
    setSearchQuery("");
    setSortBy("featured");
    setInStockOnly(false);
    setPriceBracket("all");
    setCategorySearch("");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (catalogTopRef.current) {
      catalogTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Helper for generating page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  }, [currentPage, totalPages]);

  // Reusable Filter Sidebar Contents
  const renderFilterContents = () => (
    <div className="space-y-6">
      {/* Category Section with internal scroll for many categories */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-neutral-500" />
            <span>Categories</span>
          </h4>
          {selectedCategory !== "all" && (
            <button
              type="button"
              onClick={() => handleCategoryChange("all")}
              className="text-[11px] text-neutral-500 hover:text-black cursor-pointer font-medium"
            >
              Reset
            </button>
          )}
        </div>

        {/* Small category search filter when > 5 categories exist */}
        {categoriesWithCounts.length > 5 && (
          <div className="mb-2.5 relative">
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Find category..."
              className="w-full text-xs px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:border-black"
            />
            {categorySearch && (
              <button
                type="button"
                onClick={() => setCategorySearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable list with max height so it never blows up the page */}
        <div className="max-h-56 overflow-y-auto pr-1 space-y-1 scrollbar-thin">
          {visibleCategories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => handleCategoryChange(cat.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer text-left ${
                  isSelected
                    ? "bg-black text-white font-semibold shadow-xs"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <span className="truncate">{cat.label}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${
                    isSelected ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subcategory Section */}
      {availableSubCategories.length > 0 && (
        <div className="pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-neutral-500" />
              <span>Subcategory</span>
            </h4>
            {selectedSubCategory !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedSubCategory("all")}
                className="text-[11px] text-neutral-500 hover:text-black cursor-pointer font-medium"
              >
                Reset
              </button>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto pr-1 space-y-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedSubCategory("all")}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                selectedSubCategory === "all"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span>All Subcategories</span>
            </button>
            {availableSubCategories.map((sub) => {
              const isSelected = selectedSubCategory.toLowerCase() === sub.toLowerCase();
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubCategory(sub)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                    isSelected
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <span className="truncate">{sub}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range Filter */}
      <div className="pt-4 border-t border-neutral-200">
        <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-neutral-500" />
          <span>Price Range</span>
        </h4>
        <div className="space-y-1">
          {[
            { id: "all", label: "All Prices" },
            { id: "under-3000", label: "Under PKR 3,000" },
            { id: "3000-6000", label: "PKR 3,000 - 6,000" },
            { id: "over-6000", label: "Over PKR 6,000" },
          ].map((p) => {
            const isSelected = priceBracket === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriceBracket(p.id as any)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                  isSelected
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <span>{p.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* In-Stock Switch */}
      <div className="pt-4 border-t border-neutral-200">
        <label className="flex items-center justify-between cursor-pointer select-none text-xs font-semibold text-neutral-800">
          <span className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-neutral-500" />
            <span>In-Stock Only</span>
          </span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-4 h-4 rounded text-black border-neutral-300 focus:ring-black cursor-pointer accent-black"
          />
        </label>
      </div>

      {/* Reset All Filters Button */}
      {activeFiltersCount > 0 && (
        <div className="pt-3 border-t border-neutral-200">
          <button
            type="button"
            onClick={handleClearFilters}
            className="w-full py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters ({activeFiltersCount})</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div ref={catalogTopRef} className="w-full space-y-6">
      {/* Top Search & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keyword, style, or collection..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Controls: Filter Button, Sort Selector, Items Per Page */}
        <div className="flex flex-wrap items-center gap-2.5 justify-between md:justify-end">
          {/* Desktop Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer border ${
              isSidebarOpen
                ? "bg-black text-white border-black shadow-xs"
                : "bg-white text-neutral-800 border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{isSidebarOpen ? "Hide Filters" : "Show Filters"}</span>
            {activeFiltersCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isSidebarOpen ? "bg-white text-black" : "bg-black text-white"
              }`}>
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Mobile Filter Drawer Button */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white text-black font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-neutral-200">
            <ArrowUpDown className="w-4 h-4 text-neutral-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-1.5 bg-transparent text-xs sm:text-sm font-medium text-neutral-800 focus:outline-hidden cursor-pointer"
            >
              <option value="featured">Featured / Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="in-stock">In Stock First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Side Menu + Products Grid */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Desktop Side Menu Filter Panel */}
        {isSidebarOpen && (
          <aside className="hidden md:block w-72 shrink-0 bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-xs sticky top-24 transition-all duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <span className="font-bold text-sm text-neutral-900">Filters</span>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-neutral-500 hover:text-black font-medium underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="pt-3">
              {renderFilterContents()}
            </div>
          </aside>
        )}

        {/* Mobile Slide-Over Filter Drawer */}
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileDrawerOpen(false)}
            />

            {/* Slide-over Drawer Panel */}
            <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col p-6 z-10 animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  <h3 className="font-bold text-base text-neutral-900">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-black text-white font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-black cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto py-4 space-y-6">
                {renderFilterContents()}
              </div>

              {/* Bottom Apply Button */}
              <div className="pt-4 border-t border-neutral-200 space-y-2">
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-full py-3 bg-black text-white text-sm font-semibold rounded-xl shadow-md cursor-pointer"
                >
                  View {filteredProducts.length} Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Cards & Pagination Column */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Active Filter Chips Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-500 px-1">
            <p className="text-xs sm:text-sm">
              Showing{" "}
              <span className="font-bold text-neutral-900">
                {filteredProducts.length === 0
                  ? 0
                  : `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(
                      currentPage * itemsPerPage,
                      filteredProducts.length
                    )}`}
              </span>{" "}
              of <span className="font-bold text-neutral-900">{filteredProducts.length}</span> items
            </p>

            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-neutral-400">Active:</span>

                {searchQuery.trim() !== "" && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-neutral-100 rounded-lg text-neutral-800 border border-neutral-200">
                    <span>&quot;{searchQuery}&quot;</span>
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-black"
                      onClick={() => setSearchQuery("")}
                    />
                  </span>
                )}

                {selectedCategory !== "all" && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-neutral-100 rounded-lg text-neutral-800 border border-neutral-200">
                    <span>{selectedCategory}</span>
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-black"
                      onClick={() => setSelectedCategory("all")}
                    />
                  </span>
                )}

                {selectedSubCategory !== "all" && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-neutral-100 rounded-lg text-neutral-800 border border-neutral-200">
                    <span>{selectedSubCategory}</span>
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-black"
                      onClick={() => setSelectedSubCategory("all")}
                    />
                  </span>
                )}

                {priceBracket !== "all" && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-neutral-100 rounded-lg text-neutral-800 border border-neutral-200">
                    <span>
                      {priceBracket === "under-3000"
                        ? "< PKR 3,000"
                        : priceBracket === "3000-6000"
                        ? "PKR 3K - 6K"
                        : "> PKR 6,000"}
                    </span>
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-black"
                      onClick={() => setPriceBracket("all")}
                    />
                  </span>
                )}

                {inStockOnly && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-neutral-100 rounded-lg text-neutral-800 border border-neutral-200">
                    <span>In Stock Only</span>
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-black"
                      onClick={() => setInStockOnly(false)}
                    />
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-neutral-900 underline ml-1 cursor-pointer hover:text-neutral-600"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center bg-neutral-50 rounded-3xl border border-dashed border-neutral-300">
              <Filter className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-neutral-800">No matching products found</h3>
              <p className="text-sm text-neutral-500 mt-1 max-w-sm mx-auto">
                Try resetting your filters or adjusting your search keyword to view more items.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-4 px-6 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 ${
                isSidebarOpen ? "lg:grid-cols-3" : "md:grid-cols-3 lg:grid-cols-4"
              } gap-6`}
            >
              {paginatedProducts.map((item) => {
                const stockNum = Number(item.stock);
                const isOutOfStock = stockNum <= 0;

                return (
                  <Link
                    href={`/products/${item.id}`}
                    key={item.id}
                    className={`group flex flex-col gap-3 ${
                      isOutOfStock ? "opacity-75" : ""
                    }`}
                  >
                    {/* Thumbnail Image Container */}
                    <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-neutral-100 border border-neutral-200/60 shadow-xs">
                      <Image
                        src={item.image || "/images/img1.jpg"}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Stock Badge */}
                      {isOutOfStock && (
                        <div className="absolute top-3 left-3 bg-neutral-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs">
                          Out of Stock
                        </div>
                      )}

                      {/* Hover Quick Action */}
                      <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
                        <div className="w-full py-2.5 bg-white/95 backdrop-blur-xs text-black text-xs font-bold rounded-xl text-center shadow-md">
                          View Product
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900 group-hover:text-neutral-600 transition truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 uppercase mt-0.5">
                        <span>{item.category}</span>
                        {item.subCategory && (
                          <>
                            <span>•</span>
                            <span>{item.subCategory}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="font-bold text-neutral-900 text-base">
                          PKR {Number(item.price).toLocaleString()}
                        </p>
                        {item.variants && item.variants.length > 0 && (
                          <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                            {item.variants.length} sizes
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="py-1 px-2 bg-neutral-100 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-800 cursor-pointer focus:outline-hidden"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>

              {/* Number Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {pageNumbers.map((page, index) => {
                  if (page === "...") {
                    return (
                      <span key={`ellipsis-${index}`} className="px-2 text-neutral-400 text-xs">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = page === currentPage;
                  return (
                    <button
                      key={`page-${page}`}
                      type="button"
                      onClick={() => handlePageChange(page as number)}
                      className={`w-9 h-9 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isCurrent
                          ? "bg-black text-white shadow-xs"
                          : "border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
