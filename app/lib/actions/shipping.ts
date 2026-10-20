'use server';

import { db } from "@/app/lib/db";
import { shippingRules, ShippingRule } from "@/app/db/schema";
import { ensureTablesExist, verifyAdminSession } from "@/app/lib/actions/admin";
import { eq, desc, sql, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { connection } from "next/server";

/**
 * Fetches all shipping rules from the database.
 */
export async function getShippingRulesAction(): Promise<ShippingRule[]> {
  await connection();
  try {
    await ensureTablesExist();
    return await db
      .select()
      .from(shippingRules)
      .orderBy(desc(shippingRules.isDefault), asc(shippingRules.city));
  } catch (error) {
    console.error("Error fetching shipping rules:", error);
    return [];
  }
}

/**
 * Updates or creates the DEFAULT shipping rule (fallback fee and free shipping threshold).
 */
export async function saveDefaultShippingAction(input: {
  charge: number;
  freeShippingThreshold: number;
  isActive?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminSession();
    await ensureTablesExist();

    const chargeStr = Math.max(0, input.charge).toString();
    const thresholdStr = Math.max(0, input.freeShippingThreshold).toString();
    const isActive = input.isActive ?? true;

    const existingDefault = await db
      .select()
      .from(shippingRules)
      .where(sql`${shippingRules.isDefault} = true OR UPPER(${shippingRules.city}) = 'DEFAULT'`)
      .limit(1);

    if (existingDefault.length > 0) {
      await db
        .update(shippingRules)
        .set({
          charge: chargeStr,
          freeShippingThreshold: thresholdStr,
          isActive,
          isDefault: true,
          city: "DEFAULT",
        })
        .where(eq(shippingRules.id, existingDefault[0].id));
    } else {
      await db.insert(shippingRules).values({
        city: "DEFAULT",
        charge: chargeStr,
        freeShippingThreshold: thresholdStr,
        isDefault: true,
        isActive,
      });
    }

    revalidatePath("/admin/pricing");
    revalidatePath("/checkout");
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error saving default shipping rule:", error);
    return { success: false, error: "Failed to save default shipping rule." };
  }
}

/**
 * Adds or updates a city delivery rate.
 * If city is "DEFAULT", updates the default rule.
 */
export async function addOrUpdateCityShippingRuleAction(input: {
  city: string;
  charge: number;
  freeShippingThreshold?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminSession();
    await ensureTablesExist();

    const rawCity = input.city.trim();
    if (!rawCity) {
      return { success: false, error: "City name is required." };
    }

    const isDefaultName = rawCity.toUpperCase() === "DEFAULT";
    const chargeStr = Math.max(0, input.charge).toString();
    const thresholdStr = (input.freeShippingThreshold || 8000).toString();

    if (isDefaultName) {
      return await saveDefaultShippingAction({
        charge: input.charge,
        freeShippingThreshold: input.freeShippingThreshold || 8000,
        isActive: true,
      });
    }

    // Check if rule for this city already exists
    const existing = await db
      .select()
      .from(shippingRules)
      .where(sql`UPPER(${shippingRules.city}) = ${rawCity.toUpperCase()}`)
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(shippingRules)
        .set({
          charge: chargeStr,
          freeShippingThreshold: thresholdStr,
          isActive: true,
        })
        .where(eq(shippingRules.id, existing[0].id));
    } else {
      await db.insert(shippingRules).values({
        city: rawCity,
        charge: chargeStr,
        freeShippingThreshold: thresholdStr,
        isDefault: false,
        isActive: true,
      });
    }

    revalidatePath("/admin/pricing");
    revalidatePath("/checkout");
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error adding or updating shipping rule:", error);
    return { success: false, error: "Failed to save shipping rate." };
  }
}

/**
 * Deletes a city delivery rule by ID.
 * Prevents deleting the default rule to guarantee the store always has a fallback rate.
 */
export async function deleteShippingRuleAction(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminSession();
    await ensureTablesExist();

    const rule = await db.select().from(shippingRules).where(eq(shippingRules.id, id)).limit(1);
    if (rule.length === 0) {
      return { success: false, error: "Shipping rule not found." };
    }

    if (rule[0].isDefault || rule[0].city.trim().toUpperCase() === "DEFAULT") {
      return {
        success: false,
        error: "Cannot delete the default delivery rule. You can edit its charge instead.",
      };
    }

    await db.delete(shippingRules).where(eq(shippingRules.id, id));
    revalidatePath("/admin/pricing");
    revalidatePath("/checkout");
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error deleting shipping rule:", error);
    return { success: false, error: "Failed to delete shipping rule." };
  }
}
