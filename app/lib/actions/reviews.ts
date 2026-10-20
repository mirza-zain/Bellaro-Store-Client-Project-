'use server';

import { db } from "@/app/lib/db";
import { reviews, orders, Review, OrderItem } from "@/app/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { ensureTablesExist } from "@/app/lib/actions/admin";
import { revalidatePath } from "next/cache";

export type ProductReviewsSummary = {
  reviews: Review[];
  totalReviews: number;
  averageRating: number;
  distribution: { [key: number]: number };
};

export async function getProductReviews(
  productId: number
): Promise<ProductReviewsSummary> {
  try {
    await ensureTablesExist();

    const productReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));

    const totalReviews = productReviews.length;
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (totalReviews === 0) {
      return {
        reviews: [],
        totalReviews: 0,
        averageRating: 5.0, // Default baseline
        distribution,
      };
    }

    let sum = 0;
    productReviews.forEach((r) => {
      sum += r.rating;
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating] += 1;
      }
    });

    const averageRating = Number((sum / totalReviews).toFixed(1));

    return {
      reviews: productReviews,
      totalReviews,
      averageRating,
      distribution,
    };
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return {
      reviews: [],
      totalReviews: 0,
      averageRating: 5.0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
}

export type SubmitReviewInput = {
  productId: number;
  orderId?: number | string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title?: string;
  comment: string;
};

export type SubmitReviewResult = {
  success: boolean;
  error?: string;
};

export async function submitProductReviewAction(
  input: SubmitReviewInput
): Promise<SubmitReviewResult> {
  try {
    await ensureTablesExist();

    const name = input.customerName.trim();
    const email = input.customerEmail.trim().toLowerCase();
    const comment = input.comment.trim();
    const rating = Math.min(5, Math.max(1, Math.round(Number(input.rating))));
    const title = input.title?.trim() || "";

    if (!name || !email || !comment) {
      return {
        success: false,
        error: "Please provide your name, email, and review comment.",
      };
    }

    if (!email.includes("@")) {
      return { success: false, error: "Please provide a valid email address." };
    }

    let parsedOrderId: number | null = null;
    if (input.orderId) {
      const cleaned = String(input.orderId).replace(/[^0-9]/g, "");
      if (cleaned) {
        parsedOrderId = parseInt(cleaned, 10);
      }
    }

    // Verify purchase against orders table
    let verified = false;
    let verifiedOrderId: number | null = null;

    if (parsedOrderId) {
      const match = await db
        .select()
        .from(orders)
        .where(eq(orders.id, parsedOrderId))
        .limit(1);

      if (match.length > 0) {
        const order = match[0];
        const boughtItem = order.items?.some(
          (item: OrderItem) => item.productId === input.productId
        );
        if (boughtItem) {
          verified = true;
          verifiedOrderId = order.id;
        }
      }
    }

    // If order ID was not passed or didn't match, check by email
    if (!verified) {
      const emailOrders = await db
        .select()
        .from(orders)
        .where(sql`LOWER(${orders.customerEmail}) = ${email}`)
        .orderBy(desc(orders.id));

      for (const order of emailOrders) {
        const boughtItem = order.items?.some(
          (item: OrderItem) => item.productId === input.productId
        );
        if (boughtItem) {
          verified = true;
          verifiedOrderId = order.id;
          break;
        }
      }
    }

    if (!verified) {
      return {
        success: false,
        error:
          "Verified purchase required: We could not find a completed order for this item under the provided Order ID or email address.",
      };
    }

    // Check if customer already reviewed this product for this order
    if (verifiedOrderId) {
      const existing = await db
        .select()
        .from(reviews)
        .where(
          sql`${reviews.productId} = ${input.productId} AND ${reviews.orderId} = ${verifiedOrderId}`
        )
        .limit(1);

      if (existing.length > 0) {
        return {
          success: false,
          error: "You have already submitted a review for this purchase. Thank you!",
        };
      }
    }

    await db.insert(reviews).values({
      productId: input.productId,
      orderId: verifiedOrderId,
      customerName: name,
      customerEmail: email,
      rating,
      title: title || undefined,
      comment,
      isVerifiedPurchase: true,
    });

    revalidatePath(`/products/${input.productId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error submitting product review:", error);
    return {
      success: false,
      error: "Failed to submit review. Please try again.",
    };
  }
}

export type FindVerifiedOrderResult = {
  found: boolean;
  orderId?: number;
  formattedOrderId?: string;
  customerName?: string;
  customerEmail?: string;
  error?: string;
};

export async function findVerifiedOrderAction(
  email: string,
  productId: number
): Promise<FindVerifiedOrderResult> {
  try {
    await ensureTablesExist();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { found: false };
    }

    const emailOrders = await db
      .select()
      .from(orders)
      .where(sql`LOWER(${orders.customerEmail}) = ${cleanEmail}`)
      .orderBy(desc(orders.id));

    for (const order of emailOrders) {
      const boughtItem = order.items?.some(
        (item: OrderItem) => item.productId === productId
      );
      if (boughtItem) {
        return {
          found: true,
          orderId: order.id,
          formattedOrderId: `#ORD-${order.id.toString().padStart(4, "0")}`,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
        };
      }
    }

    return { found: false };
  } catch (error) {
    console.error("Error finding verified order:", error);
    return { found: false, error: "Failed to look up order." };
  }
}
