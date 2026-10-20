import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/app/lib/db";
import * as schema from "@/app/db/schema";
import { nextCookies } from "better-auth/next-js";

const productionUrl =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://bellaro-store.vercel.app";
const localUrl = "http://localhost:3000";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // Strictly prevents any caller or API payload from setting role
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // Disables public sign-up completely
  },
  secret: process.env.BETTER_AUTH_SECRET || "bellaro_better_auth_secret_secure_key_2026_younus_admin_99218",
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "production" ? productionUrl : localUrl),
  // Allowed / Trusted origins for CSRF and origin validation across localhost and production Vercel
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://bellaro-store.vercel.app",
    "https://*.vercel.app",
    "https://bellaro.pk",
    "https://*.bellaro.pk",
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ],
  plugins: [nextCookies()],
});
