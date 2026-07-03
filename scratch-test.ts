import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "./db/index";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Checking tables...");
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log("Tables in DB:", result.map((row: any) => row.table_name));
  } catch (error) {
    console.error("Database connection failed:", error);
  }
  process.exit(0);
}

main();
