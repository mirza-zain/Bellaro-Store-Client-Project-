'use server';

import webpush from "web-push";
import { db } from "@/app/lib/db";
import { pushSubscriptions } from "@/app/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyAdminSession } from "@/app/lib/actions/admin";

// Configure Web Push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@younus.com";

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (error) {
    console.error("Failed to initialize web-push VAPID details:", error);
  }
}

export type PushNotificationPayload = {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  badge?: string;
  data?: Record<string, any>;
};

export type SerializedSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

/**
 * Save or update a client's push subscription
 */
export async function savePushSubscriptionAction(
  subscription: SerializedSubscription,
  userType: "admin" | "customer" = "admin",
  userEmail?: string
) {
  try {
    if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return { success: false, error: "Invalid subscription payload." };
    }

    // Check if subscription exists
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(pushSubscriptions)
        .set({
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userType,
          userEmail: userEmail || null,
        })
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
    } else {
      await db.insert(pushSubscriptions).values({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userType,
        userEmail: userEmail || null,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error saving push subscription:", error);
    return { success: false, error: error?.message || "Failed to save subscription" };
  }
}

/**
 * Remove a subscription from the database (e.g. on unsubscribe)
 */
export async function unsubscribeAction(endpoint: string) {
  try {
    if (!endpoint) return { success: false };
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    return { success: true };
  } catch (error) {
    console.error("Error unsubscribing:", error);
    return { success: false };
  }
}

/**
 * Send a web push notification to a specific subscription
 */
export async function sendPushToSubscription(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: PushNotificationPayload
) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("VAPID keys not configured. Skipping push notification.");
    return false;
  }

  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  };

  const notificationString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/favicon.ico",
    badge: payload.badge || "/favicon.ico",
    url: payload.url || "/admin/manageOrders",
    data: payload.data || {},
  });

  try {
    await webpush.sendNotification(pushSubscription, notificationString);
    return true;
  } catch (err: any) {
    // If the endpoint is expired or gone (404/410), delete it from DB
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      console.log("Subscription expired/unregistered, removing from DB:", sub.endpoint);
      try {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
      } catch {}
    } else {
      console.error("Failed to deliver push notification:", err);
    }
    return false;
  }
}

/**
 * Send order notification to all subscribed admin devices
 */
export async function sendOrderNotificationToAdmin(details: {
  orderId: number | string;
  orderCode?: string;
  customerName: string;
  totalAmount: number | string;
  itemsCount: number;
}) {
  try {
    const adminSubs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userType, "admin"));

    if (!adminSubs.length) {
      console.log("No active admin push subscriptions found.");
      return { sent: 0 };
    }

    const orderRef = details.orderCode ? details.orderCode : `#${details.orderId}`;
    const payload: PushNotificationPayload = {
      title: `🛍️ New Order ${orderRef} Placed!`,
      body: `${details.customerName} ordered ${details.itemsCount} item(s) • Total: Rs. ${Number(details.totalAmount).toLocaleString()}`,
      icon: "/favicon.ico",
      url: `/admin/manageOrders`,
      data: {
        orderId: details.orderId,
        orderCode: details.orderCode,
      },
    };

    let sentCount = 0;
    for (const sub of adminSubs) {
      const ok = await sendPushToSubscription(sub, payload);
      if (ok) sentCount++;
    }

    return { sent: sentCount };
  } catch (error) {
    console.error("Error broadcasting order notification:", error);
    return { sent: 0 };
  }
}

/**
 * Send an immediate test notification to verify push setup
 */
export async function sendTestPushNotificationAction() {
  try {
    await verifyAdminSession();
  } catch {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSubs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userType, "admin"));

    if (!adminSubs.length) {
      return {
        success: false,
        error: "No subscribed admin devices found. Please enable browser notifications on this device first.",
      };
    }

    const payload: PushNotificationPayload = {
      title: "🔔 Bellaro Notifications Active!",
      body: "Browser Web Push notifications are successfully connected and functioning.",
      icon: "/favicon.ico",
      url: "/admin",
      data: { test: true },
    };

    let sent = 0;
    for (const sub of adminSubs) {
      const ok = await sendPushToSubscription(sub, payload);
      if (ok) sent++;
    }

    return { success: true, count: sent };
  } catch (error: any) {
    console.error("Error sending test push notification:", error);
    return { success: false, error: error?.message || "Failed to send test push" };
  }
}
