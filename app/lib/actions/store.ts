'use server';

import { db } from "@/app/lib/db";
import { products, Product } from "@/app/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureTablesExist } from "@/app/lib/actions/admin";
import { unstable_cache } from "next/cache";

export type StoreFilterOptions = {
  category?: string;
  subCategory?: string;
  search?: string;
  sort?: string;
  limit?: number;
};

/**
 * High-performance in-memory / edge-cached fetcher for active store products.
 * Tagged with 'products' and purged immediately whenever an admin updates the catalog.
 */
const fetchCachedAllProducts = unstable_cache(
  async (): Promise<Product[]> => {
    try {
      await ensureTablesExist();
      return await db.select().from(products).orderBy(desc(products.id));
    } catch (error) {
      console.error("Error fetching cached store products from DB:", error);
      return [];
    }
  },
  ["all-store-products-cache"],
  {
    tags: ["products"],
    revalidate: 86400, // 24 hours fallback, immediately purged on update
  }
);

/**
 * High-performance cached fetcher for individual product detail views.
 */
const fetchCachedProductById = unstable_cache(
  async (productId: number): Promise<Product | null> => {
    try {
      await ensureTablesExist();
      const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error fetching cached product #${productId} from DB:`, error);
      return null;
    }
  },
  ["single-product-cache"],
  {
    tags: ["products"],
    revalidate: 86400,
  }
);

export async function getStoreProducts(
  options?: StoreFilterOptions
): Promise<Product[]> {
  try {
    const dbProducts = await fetchCachedAllProducts();
    let items = [...dbProducts];

    // Filter by Category (Footwear/Shoes flexible alias support)
    if (options?.category && options.category.toLowerCase() !== "all") {
      const targetCat = options.category.toLowerCase();
      items = items.filter((p) => {
        const itemCat = p.category.toLowerCase();
        if (targetCat === "footwear" || targetCat === "shoes") {
          return itemCat === "footwear" || itemCat === "shoes";
        }
        return itemCat === targetCat;
      });
    }

    // Filter by Sub-Category
    if (options?.subCategory && options.subCategory.toLowerCase() !== "all") {
      items = items.filter(
        (p) => p.subCategory.toLowerCase() === options.subCategory!.toLowerCase()
      );
    }

    // Search query
    if (options?.search && options.search.trim() !== "") {
      const q = options.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.subCategory.toLowerCase().includes(q)
      );
    }

    // Sort
    if (options?.sort) {
      if (options.sort === "price-asc") {
        items.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (options.sort === "price-desc") {
        items.sort((a, b) => Number(b.price) - Number(a.price));
      } else if (options.sort === "name-asc") {
        items.sort((a, b) => a.name.localeCompare(b.name));
      }
    }

    // Limit
    if (options?.limit && options.limit > 0) {
      items = items.slice(0, options.limit);
    }

    return items;
  } catch (error) {
    console.error("Error fetching store products:", error);
    return [];
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  return await fetchCachedProductById(id);
}

export type NavCategoryGroup = {
  category: string;
  href: string;
  subCategories: { name: string; href: string }[];
};

const fetchCachedNavCategories = unstable_cache(
  async (): Promise<NavCategoryGroup[]> => {
    try {
      const rows = await fetchCachedAllProducts();

      if (!rows || rows.length === 0) {
        return [];
      }

      const catMap = new Map<string, Set<string>>();
      for (const r of rows) {
        const cat = r.category?.trim();
        if (!cat) continue;
        if (!catMap.has(cat)) {
          catMap.set(cat, new Set());
        }
        const sub = r.subCategory?.trim();
        if (sub && sub.toLowerCase() !== "general" && sub.toLowerCase() !== "default") {
          catMap.get(cat)!.add(sub);
        }
      }

      const navGroups: NavCategoryGroup[] = [];
      for (const [catName, subSet] of catMap.entries()) {
        const subCategories: { name: string; href: string }[] = Array.from(subSet).map((sub) => ({
          name: sub,
          href: `/products?category=${encodeURIComponent(catName)}&subCategory=${encodeURIComponent(sub)}`,
        }));

        // Add "All {category}" entry
        subCategories.push({
          name: `All ${catName}`,
          href: `/products?category=${encodeURIComponent(catName)}`,
        });

        navGroups.push({
          category: catName,
          href: `/products?category=${encodeURIComponent(catName)}`,
          subCategories,
        });
      }

      return navGroups;
    } catch (error) {
      console.error("Error generating nav categories:", error);
      return [];
    }
  },
  ["store-nav-categories-cache"],
  {
    tags: ["products", "categories"],
    revalidate: 86400,
  }
);

export async function getStoreNavCategoriesAction(): Promise<NavCategoryGroup[]> {
  return await fetchCachedNavCategories();
}
