import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const connectionString = (process.env.DATABASE_URL || "").trim();
const sql = neon(connectionString || "postgresql://user:pass@ep-placeholder.us-east-2.aws.neon.tech/neondb");

export const db = drizzle(sql);