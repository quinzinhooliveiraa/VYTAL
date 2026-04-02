import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or NEON_DATABASE_URL must be set.");
}

const isNeon = connectionString.includes("neon.tech") || connectionString.includes("neon.database");

export const pool = new Pool({
  connectionString,
  ssl: isNeon ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
