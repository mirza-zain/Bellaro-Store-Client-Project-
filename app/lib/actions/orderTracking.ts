'use server';

import { db } from "@/app/lib/db";
import { orders, Order } from "@/app/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { ensureTablesExist } from "@/app/lib/actions/admin";

export async function trackOrderAction(query: string): Promise<Order | null> {
  try {
    await ensureTablesExist();
    const clean = query.trim();
    if (!clean) return null;

    const upperClean = clean.toUpperCase();

    const sanitize = (ord: Order): Order => ({
      ...ord,
      paymentProof: null, // Security: never expose uploaded bank receipts via public tracking
    });

    // 1. Unique Tracking Code lookup (e.g. "BAZ-4829", "#BAZ-4829", or "4829")
    // Strictly disallows simple sequential numbers (like 2, 3, etc.) for customer privacy
    const strippedCode = upperClean.replace(/^#/, "");
    
    // Match BAZ-XXXX directly or candidate format
    if (strippedCode.startsWith("BAZ-") || (strippedCode.length === 4 && /^\d{4}$/.test(strippedCode))) {
      const formattedCandidate = strippedCode.startsWith("BAZ-") ? strippedCode : `BAZ-${strippedCode}`;
      
      const byCode = await db
        .select()
        .from(orders)
        .where(sql`UPPER(${orders.orderCode}) = ${formattedCandidate} OR UPPER(${orders.orderCode}) = ${strippedCode}`)
        .limit(1);

      if (byCode.length > 0) return sanitize(byCode[0]);
    }

    // 2. Verified lookup by full customer email address
    if (clean.includes("@")) {
      const byEmail = await db
        .select()
        .from(orders)
        .where(sql`LOWER(${orders.customerEmail}) = LOWER(${clean})`)
        .orderBy(desc(orders.id))
        .limit(1);

      if (byEmail.length > 0) return sanitize(byEmail[0]);
    }

    return null;
  } catch (error) {
    console.error("Error tracking order:", error);
    return null;
  }
}

