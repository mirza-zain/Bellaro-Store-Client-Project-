'use server';

import { db } from "@/app/lib/db";
import { products, Product } from "@/app/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureTablesExist } from "@/app/lib/actions/admin";
import { connection } from "next/server";

export type StoreFilterOptions = {
  category?: string;
  subCategory?: string;
  search?: string;
  sort?: string;
  limit?: number;
};

export async function getStoreProducts(
  options?: StoreFilterOptions
): Promise<Product[]> {
  await connection();
  try {
    await ensureTablesExist();

    const dbProducts = await db.select().from(products).orderBy(desc(products.id));
    let items = dbProducts;

    // Filter by Category
    if (options?.category && options.category.toLowerCase() !== "all") {
      items = items.filter(
        (p) => p.category.toLowerCase() === options.category!.toLowerCase()
      );
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
  await connection();
  try {
    await ensureTablesExist();
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (result.length > 0) return result[0];
    return null;
  } catch (error) {
    console.error("Error fetching product by id:", error);
    return null;
  }
}

export type NavCategoryGroup = {
  category: string;
  href: string;
  subCategories: { name: string; href: string }[];
};

export async function getStoreNavCategoriesAction(): Promise<NavCategoryGroup[]> {
  try {
    await connection();
  } catch {}
  try {
    await ensureTablesExist();
    const rows = await db
      .select({
        category: products.category,
        subCategory: products.subCategory,
      })
      .from(products);

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
    console.error("Error fetching nav categories from db:", error);
    return [];
  }
}
