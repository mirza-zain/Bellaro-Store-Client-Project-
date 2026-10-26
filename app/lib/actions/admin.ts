'use server';

import { db } from "@/app/lib/db";
import { orders, products, discountCodes, storeSettings, Order, Product, ProductVariant, DiscountCode } from "@/app/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { isCanonicalAdmin } from "@/app/lib/security";
import { uploadToCloudinary, uploadFileAction } from "@/app/lib/cloudinary";

let tablesEnsured = false;

// Ensure tables exist on Neon if migrations haven't run yet
export async function ensureTablesExist() {
  if (tablesEnsured || !process.env.DATABASE_URL) return;
  try {
    await connection();
  } catch {}
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        "subCategory" TEXT NOT NULL,
        price NUMERIC NOT NULL,
        stock NUMERIC NOT NULL,
        image TEXT,
        variants JSONB NOT NULL DEFAULT '[]'::jsonb
      );
    `);

    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb;
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        city TEXT,
        country TEXT DEFAULT 'Pakistan',
        total_amount NUMERIC NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        payment_method TEXT NOT NULL DEFAULT 'cod',
        payment_proof TEXT,
        payment_status TEXT NOT NULL DEFAULT 'Pending',
        discount_code TEXT,
        discount_amount NUMERIC DEFAULT '0',
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Pakistan';
    `);

    await db.execute(sql`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_code TEXT;
    `);

    await db.execute(sql`
      UPDATE orders 
      SET order_code = CONCAT('BAZ-', LPAD((1000 + (id % 9000))::text, 4, '0')) 
      WHERE order_code IS NULL;
    `);

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS orders_order_code_idx ON orders (order_code);
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS discount_codes (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        discount_percent NUMERIC NOT NULL,
        min_order_amount NUMERIC DEFAULT '0',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Unread',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        order_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        rating INTEGER NOT NULL,
        title TEXT,
        comment TEXT NOT NULL,
        is_verified_purchase BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS shipping_rules (
        id SERIAL PRIMARY KEY,
        city TEXT NOT NULL,
        charge NUMERIC NOT NULL,
        free_shipping_threshold NUMERIC DEFAULT '8000',
        is_default BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ensure default rule exists
    await db.execute(sql`
      INSERT INTO shipping_rules (city, charge, free_shipping_threshold, is_default, is_active)
      SELECT 'DEFAULT', '250', '8000', true, true
      WHERE NOT EXISTS (
        SELECT 1 FROM shipping_rules WHERE is_default = true OR UPPER(city) = 'DEFAULT'
      );
    `);

    // Seed default Karachi rate if not present
    await db.execute(sql`
      INSERT INTO shipping_rules (city, charge, free_shipping_threshold, is_default, is_active)
      SELECT 'Karachi', '150', '8000', false, true
      WHERE NOT EXISTS (
        SELECT 1 FROM shipping_rules WHERE UPPER(city) = 'KARACHI'
      );
    `);
    // Better-Auth Tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
        image TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
    `);

    await db.execute(sql`
      UPDATE "user" SET role = 'admin' WHERE LOWER(email) = 'admin@younus.com';
    `);

    await db.execute(sql`
      UPDATE "user" SET role = 'user' WHERE LOWER(email) != 'admin@younus.com';
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        "expiresAt" TIMESTAMP NOT NULL,
        token TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        scope TEXT,
        password TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        user_type TEXT NOT NULL DEFAULT 'admin',
        user_email TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS store_settings (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      INSERT INTO store_settings (key, value)
      VALUES 
        ('adult_footwear_sizes', '39, 40, 41, 42, 43, 44, 45'),
        ('kids_footwear_sizes', '28, 29, 30, 31, 32, 33, 34, 35')
      ON CONFLICT (key) DO NOTHING;
    `);

    tablesEnsured = true;
  } catch (error) {
    console.error("Error creating tables:", error);
    tablesEnsured = true; // Mark ensured to avoid infinite retry overhead during runtime
  }
}

export type FootwearSizePresets = {
  adultSizes: string[];
  kidsSizes: string[];
  rawAdult: string;
  rawKids: string;
};

export async function getFootwearSizePresets(): Promise<FootwearSizePresets> {
  try {
    await ensureTablesExist();
    const rows = await db.select().from(storeSettings);
    const adultRow = rows.find((r) => r.key === "adult_footwear_sizes");
    const kidsRow = rows.find((r) => r.key === "kids_footwear_sizes");

    const rawAdult = adultRow?.value || "39, 40, 41, 42, 43, 44, 45";
    const rawKids = kidsRow?.value || "28, 29, 30, 31, 32, 33, 34, 35";

    const adultSizes = rawAdult.split(",").map((s) => s.trim()).filter(Boolean);
    const kidsSizes = rawKids.split(",").map((s) => s.trim()).filter(Boolean);

    return { adultSizes, kidsSizes, rawAdult, rawKids };
  } catch (e) {
    console.warn("Using default footwear size presets:", e);
    return {
      adultSizes: ["39", "40", "41", "42", "43", "44", "45"],
      kidsSizes: ["28", "29", "30", "31", "32", "33", "34", "35"],
      rawAdult: "39, 40, 41, 42, 43, 44, 45",
      rawKids: "28, 29, 30, 31, 32, 33, 34, 35",
    };
  }
}

export async function updateFootwearSizePresetsAction(input: {
  adultSizes: string;
  kidsSizes: string;
}) {
  await verifyAdminSession();
  try {
    await ensureTablesExist();

    const cleanAdult = input.adultSizes.trim() || "39, 40, 41, 42, 43, 44, 45";
    const cleanKids = input.kidsSizes.trim() || "28, 29, 30, 31, 32, 33, 34, 35";

    await db.insert(storeSettings).values({
      key: "adult_footwear_sizes",
      value: cleanAdult,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: storeSettings.key,
      set: { value: cleanAdult, updatedAt: new Date() },
    });

    await db.insert(storeSettings).values({
      key: "kids_footwear_sizes",
      value: cleanKids,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: storeSettings.key,
      set: { value: cleanKids, updatedAt: new Date() },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/manageProducts");
    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating size presets:", error);
    return { success: false, error: error?.message || "Failed to save size presets." };
  }
}

export async function applySizesToCategoryAction(input: {
  target: "adults" | "kids" | "all";
}) {
  await verifyAdminSession();
  try {
    await ensureTablesExist();
    const presets = await getFootwearSizePresets();
    const allProducts = await db.select().from(products);

    const footwearProducts = allProducts.filter(
      (p) => p.category?.toLowerCase() === "footwear"
    );

    let updatedCount = 0;

    for (const prod of footwearProducts) {
      const isKids =
        prod.name.toLowerCase().includes("kid") ||
        prod.subCategory?.toLowerCase().includes("kid") ||
        prod.description?.toLowerCase().includes("kid");

      let sizesToApply: string[] = [];
      if (input.target === "kids" && isKids) {
        sizesToApply = presets.kidsSizes;
      } else if (input.target === "adults" && !isKids) {
        sizesToApply = presets.adultSizes;
      } else if (input.target === "all") {
        sizesToApply = isKids ? presets.kidsSizes : presets.adultSizes;
      }

      if (sizesToApply.length > 0) {
        const basePrice = Number(prod.price) || 4500;
        const variants: ProductVariant[] = sizesToApply.map((size) => ({
          label: size,
          price: basePrice,
          stock: 20,
        }));

        await db
          .update(products)
          .set({ variants })
          .where(eq(products.id, prod.id));

        updatedCount++;
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/manageProducts");
    revalidatePath("/products");
    return { success: true, count: updatedCount };
  } catch (error: any) {
    console.error("Error applying sizes to category:", error);
    return { success: false, error: error?.message || "Failed to update category sizes." };
  }
}

export type DashboardStats = {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockCount: number;
};

export type DashboardData = {
  stats: DashboardStats;
  recentProducts: Product[];
  recentOrders: Order[];
  sizePresets: FootwearSizePresets;
};

export async function getDashboardData(): Promise<DashboardData> {
  await ensureTablesExist();

  try {
    await verifyAdminSession();
    const allProducts = await db.select().from(products).orderBy(desc(products.id));
    const allOrders = await db.select().from(orders).orderBy(desc(orders.id));
    const sizePresets = await getFootwearSizePresets();

    const totalRevenue = allOrders.reduce((sum, order) => {
      return sum + (Number(order.totalAmount) || 0);
    }, 0);

    const lowStockCount = allProducts.filter((p) => Number(p.stock) < 10).length;

    return {
      stats: {
        totalProducts: allProducts.length,
        totalOrders: allOrders.length,
        totalRevenue,
        lowStockCount,
      },
      recentProducts: allProducts.slice(0, 10),
      recentOrders: allOrders.slice(0, 10),
      sizePresets,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    const sizePresets = await getFootwearSizePresets();
    return {
      stats: {
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lowStockCount: 0,
      },
      recentProducts: [],
      recentOrders: [],
      sizePresets,
    };
  }
}

export async function verifyAdminSession() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session?.user || !isCanonicalAdmin(session.user as any)) {
    throw new Error("Access Denied: Standard 'User' role detected. Administrative actions strictly restricted to admin@younus.com.");
  }
  return session;
}

export async function addProductAction(formData: FormData) {
  try {
    await verifyAdminSession();
    await ensureTablesExist();

    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || "No description provided.";
    const category = formData.get("category") as string;
    const subCategory = (formData.get("subCategory") as string) || "General";
    let price = formData.get("price") as string;
    let stock = formData.get("stock") as string;

    const variantsRaw = formData.get("variants") as string | null;
    let parsedVariants: ProductVariant[] = [];
    if (variantsRaw) {
      try {
        const raw = JSON.parse(variantsRaw);
        if (Array.isArray(raw)) {
          parsedVariants = raw
            .map((v: any) => ({
              label: String(v.label || "").trim(),
              price: Math.max(0, Number(v.price) || 0),
              stock: Math.max(0, Number(v.stock) || 0),
            }))
            .filter((v: ProductVariant) => v.label.length > 0);
        }
      } catch (e) {
        console.warn("Failed to parse variants JSON:", e);
      }
    }

    if (parsedVariants.length > 0) {
      const minPrice = Math.min(...parsedVariants.map((v) => v.price));
      price = minPrice > 0 ? minPrice.toString() : (price || "0");
      const totalStock = parsedVariants.reduce((sum, v) => sum + v.stock, 0);
      stock = totalStock.toString();
    }
    
    // Cloudinary image upload handling
    const imageInput = (formData.get("image") as string) || "";
    let finalImageUrl = imageInput.trim();

    const imageFile = formData.get("imageFile") as File | null;
    if (imageFile && typeof imageFile !== "string" && imageFile.size > 0) {
      const uploadRes = await uploadFileAction(formData);
      if (uploadRes.success && uploadRes.url) {
        finalImageUrl = uploadRes.url;
      }
    } else if (imageInput && imageInput.startsWith("data:image/")) {
      const uploadRes = await uploadToCloudinary(imageInput, "bazzario/products");
      if (uploadRes.success && uploadRes.url) {
        finalImageUrl = uploadRes.url;
      }
    }

    if (!name || !price || !category) {
      return { success: false, error: "Name, price, and category are required." };
    }

    await db.insert(products).values({
      name,
      description,
      category,
      subCategory,
      price: price.toString(),
      stock: (stock || "10").toString(),
      image: finalImageUrl,
      variants: parsedVariants,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/manageProducts");
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Error adding product:", error);
    return { success: false, error: "Failed to add product." };
  }
}

export async function deleteProductAction(productId: number) {
  try {
    await verifyAdminSession();
    await ensureTablesExist();
    await db.delete(products).where(eq(products.id, productId));
    revalidatePath("/admin");
    revalidatePath("/admin/manageProducts");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Failed to delete product." };
  }
}

export async function updateOrderStatusAction(orderId: number, status: string) {
  try {
    await verifyAdminSession();
    await ensureTablesExist();
    await db.update(orders).set({ status }).where(eq(orders.id, orderId));
    revalidatePath("/admin");
    revalidatePath("/admin/manageOrders");
    revalidatePath("/track");
    return { success: true };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, error: "Failed to update status." };
  }
}

export async function verifyPaymentAction(orderId: number, paymentStatus: "Verified" | "Rejected") {
  try {
    await verifyAdminSession();
    await ensureTablesExist();
    const updateData: { paymentStatus: string; status?: string } = { paymentStatus };
    if (paymentStatus === "Verified") {
      updateData.status = "Processing";
    }
    await db.update(orders).set(updateData).where(eq(orders.id, orderId));
    revalidatePath("/admin");
    revalidatePath("/admin/manageOrders");
    revalidatePath("/track");
    return { success: true };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return { success: false, error: "Failed to update payment status." };
  }
}

export async function deleteOrderAction(orderId: number) {
  try {
    await verifyAdminSession();
    await ensureTablesExist();
    await db.delete(orders).where(eq(orders.id, orderId));
    revalidatePath("/admin");
    revalidatePath("/admin/manageOrders");
    return { success: true };
  } catch (error) {
    console.error("Error deleting order:", error);
    return { success: false, error: "Failed to delete order." };
  }
}

export async function updateProductAction(productId: number, formData: FormData) {
  try {
    await verifyAdminSession();
    await ensureTablesExist();

    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || "No description provided.";
    const category = formData.get("category") as string;
    const subCategory = (formData.get("subCategory") as string) || "General";
    let price = formData.get("price") as string;
    let stock = formData.get("stock") as string;

    const variantsRaw = formData.get("variants") as string | null;
    let parsedVariants: ProductVariant[] | undefined = undefined;
    if (variantsRaw !== null) {
      try {
        const raw = JSON.parse(variantsRaw);
        if (Array.isArray(raw)) {
          parsedVariants = raw
            .map((v: any) => ({
              label: String(v.label || "").trim(),
              price: Math.max(0, Number(v.price) || 0),
              stock: Math.max(0, Number(v.stock) || 0),
            }))
            .filter((v: ProductVariant) => v.label.length > 0);
        }
      } catch (e) {
        console.warn("Failed to parse variants JSON in updateProductAction:", e);
      }
    }

    if (parsedVariants && parsedVariants.length > 0) {
      const minPrice = Math.min(...parsedVariants.map((v) => v.price));
      price = minPrice > 0 ? minPrice.toString() : (price || "0");
      const totalStock = parsedVariants.reduce((sum, v) => sum + v.stock, 0);
      stock = totalStock.toString();
    }

    const imageInput = (formData.get("image") as string) || "";
    let finalImageUrl = imageInput.trim();

    const imageFile = (formData.get("file") || formData.get("imageFile")) as File | null;
    if (imageFile && typeof imageFile !== "string" && imageFile.size > 0) {
      const uploadFormData = new FormData();
      uploadFormData.append("file", imageFile);
      uploadFormData.append("folder", "bazzario/products");
      const uploadRes = await uploadFileAction(uploadFormData);
      if (uploadRes.success && uploadRes.url) {
        finalImageUrl = uploadRes.url;
      }
    } else if (imageInput && imageInput.startsWith("data:image/")) {
      const uploadRes = await uploadToCloudinary(imageInput, "bazzario/products");
      if (uploadRes.success && uploadRes.url) {
        finalImageUrl = uploadRes.url;
      }
    }

    if (!name || !price || !category) {
      return { success: false, error: "Name, price, and category are required." };
    }

    const updateFields: any = {
      name,
      description,
      category,
      subCategory,
      price: price.toString(),
      stock: (stock || "0").toString(),
    };

    if (parsedVariants !== undefined) {
      updateFields.variants = parsedVariants;
    }

    if (finalImageUrl) {
      updateFields.image = finalImageUrl;
    }

    await db.update(products).set(updateFields).where(eq(products.id, productId));

    revalidatePath("/admin");
    revalidatePath("/admin/manageProducts");
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating product:", error);
    return { success: false, error: "Failed to update product." };
  }
}

export async function updateProductStockAction(productId: number, newStock: number) {
  try {
    await verifyAdminSession();
    await ensureTablesExist();
    await db.update(products).set({ stock: newStock.toString() }).where(eq(products.id, productId));
    revalidatePath("/admin");
    revalidatePath("/admin/manageProducts");
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Error updating stock:", error);
    return { success: false, error: "Failed to update stock." };
  }
}

export async function getAllProductsAction(): Promise<Product[]> {
  await ensureTablesExist();
  try {
    return await db.select().from(products).orderBy(desc(products.id));
  } catch (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
}

export async function getAllOrdersAction(): Promise<Order[]> {
  await ensureTablesExist();
  try {
    await verifyAdminSession();
    return await db.select().from(orders).orderBy(desc(orders.id));
  } catch (error) {
    console.error("Error fetching all orders (unauthorized):", error);
    return [];
  }
}

export async function getDiscountCodesAction(): Promise<DiscountCode[]> {
  await connection();
  try {
    await verifyAdminSession();
    await ensureTablesExist();
    return await db.select().from(discountCodes).orderBy(desc(discountCodes.id));
  } catch (error) {
    console.error("Error fetching discount codes (unauthorized):", error);
    return [];
  }
}

export async function createDiscountCodeAction(formData: FormData) {
  try {
    await verifyAdminSession();
    await ensureTablesExist();
    const code = (formData.get("code") as string)?.trim().toUpperCase();
    const discountPercent = formData.get("discountPercent") as string;
    const minOrderAmount = (formData.get("minOrderAmount") as string) || "0";

    if (!code || !discountPercent) {
      return { success: false, error: "Code and discount percentage are required." };
    }

    await db.insert(discountCodes).values({
      code,
      discountPercent: discountPercent.toString(),
      minOrderAmount: minOrderAmount.toString(),
      isActive: true,
    });

    revalidatePath("/admin/pricing");
    return { success: true };
  } catch (error) {
    console.error("Error creating discount code:", error);
    return { success: false, error: "Failed to create discount code (code may already exist)." };
  }
}

export async function deleteDiscountCodeAction(id: number) {
  try {
    await verifyAdminSession();
    await ensureTablesExist();
    await db.delete(discountCodes).where(eq(discountCodes.id, id));
    revalidatePath("/admin/pricing");
    return { success: true };
  } catch (error) {
    console.error("Error deleting discount code:", error);
    return { success: false, error: "Failed to delete discount code." };
  }
}


