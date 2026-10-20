import { boolean, integer, jsonb, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export type ProductVariant = {
  label: string;
  price: number;
  stock: number;
};

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  subCategory: text("subCategory").notNull(),
  price: numeric("price").notNull(),
  stock: numeric("stock").notNull(),
  image: text("image"),
  variants: jsonb("variants").$type<ProductVariant[]>().notNull().default([]),
});

export type OrderItem = {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  variant?: string;
};

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderCode: text("order_code").unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  country: text("country").default("Pakistan"),
  totalAmount: numeric("total_amount").notNull(),
  status: text("status").notNull().default("Pending"), // 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  paymentMethod: text("payment_method").notNull().default("cod"), // 'cod' | 'bank_transfer'
  paymentProof: text("payment_proof"), // screenshot image URL or base64
  paymentStatus: text("payment_status").notNull().default("Pending"), // 'Pending' | 'Verified' | 'Rejected'
  discountCode: text("discount_code"),
  discountAmount: numeric("discount_amount").default("0"),
  items: jsonb("items").$type<OrderItem[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountPercent: numeric("discount_percent").notNull(),
  minOrderAmount: numeric("min_order_amount").default("0"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  status: text("status").notNull().default("Unread"), // 'Unread' | 'Replied' | 'Archived'
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  orderId: integer("order_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  rating: integer("rating").notNull(), // 1 to 5
  title: text("title"),
  comment: text("comment").notNull(),
  isVerifiedPurchase: boolean("is_verified_purchase").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shippingRules = pgTable("shipping_rules", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(), // 'DEFAULT' or specific city like 'Karachi', 'Lahore'
  charge: numeric("charge").notNull(), // Delivery fee in PKR
  freeShippingThreshold: numeric("free_shipping_threshold").default("8000"), // PKR threshold
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Better-Auth Tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userType: text("user_type").notNull().default("admin"),
  userEmail: text("user_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type NewDiscountCode = typeof discountCodes.$inferInsert;
export type Inquiry = typeof inquiries.$inferSelect;
export type NewInquiry = typeof inquiries.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type ShippingRule = typeof shippingRules.$inferSelect;
export type NewShippingRule = typeof shippingRules.$inferInsert;
export type PushSubscriptionRecord = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscriptionRecord = typeof pushSubscriptions.$inferInsert;
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;


