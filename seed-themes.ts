import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { themes } from "./db/schema";

const sql = postgres(process.env.MIGRATION_DATABASE_URL!, { max: 1 });
const db = drizzle(sql);

async function main() {
  await db.insert(themes).values([
    {
      id: "elegance",
      name: "Elegance",
      cssVariables: {
        colors: {
          surface: "#ffffff",
          ink: "#000000",
          primary: "#3b82f6"
        },
        typography: {
          headingFont: "Inter",
          bodyFont: "Roboto"
        },
        layout: {
          borderRadius: "0.5rem"
        }
      }
    },
    {
      id: "sunset",
      name: "Sunset",
      cssVariables: {
        colors: {
          surface: "#fffbeb",
          ink: "#3f3f46",
          primary: "#f97316"
        },
        typography: {
          headingFont: "Outfit",
          bodyFont: "Inter"
        },
        layout: {
          borderRadius: "1rem"
        }
      }
    },
    {
      id: "midnight",
      name: "Midnight",
      cssVariables: {
        colors: {
          surface: "#09090b",
          ink: "#fafafa",
          primary: "#8b5cf6"
        },
        typography: {
          headingFont: "Roboto",
          bodyFont: "Roboto"
        },
        layout: {
          borderRadius: "0"
        }
      }
    }
  ]).onConflictDoNothing();
  console.log("Themes seeded!");
}
main();
