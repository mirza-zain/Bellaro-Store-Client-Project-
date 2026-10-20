CREATE TABLE "discount_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"discount_percent" numeric NOT NULL,
	"min_order_amount" numeric DEFAULT '0',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"phone" text,
	"address" text,
	"city" text,
	"total_amount" numeric NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"payment_method" text DEFAULT 'cod' NOT NULL,
	"payment_proof" text,
	"payment_status" text DEFAULT 'Pending' NOT NULL,
	"discount_code" text,
	"discount_amount" numeric DEFAULT '0',
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"subCategory" text NOT NULL,
	"price" numeric NOT NULL,
	"stock" numeric NOT NULL,
	"image" text,
	"variants" jsonb DEFAULT '[]'::jsonb NOT NULL
);
