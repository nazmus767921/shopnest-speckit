import { db } from "./db";
import { storeTemplates } from "./db/schema";
import { randomUUID } from "crypto";

async function main() {
  await db.insert(storeTemplates).values([
    {
      id: randomUUID(),
      slug: "elegance",
      name: "Elegance",
      description: "A premium and neutral theme",
      allowedTiers: ["starter", "growth", "pro"],
      businessTypes: ["Fashion", "Beauty", "Retail"],
      previewImageUrl: "https://via.placeholder.com/600x400?text=Elegance",
      sortOrder: 1,
      isActive: true,
    },
    {
      id: randomUUID(),
      slug: "sunset",
      name: "Sunset",
      description: "A vibrant theme for modern stores",
      allowedTiers: ["starter", "growth", "pro"],
      businessTypes: ["Apparel", "Electronics"],
      previewImageUrl: "https://via.placeholder.com/600x400?text=Sunset",
      sortOrder: 2,
      isActive: true,
    },
    {
      id: randomUUID(),
      slug: "midnight",
      name: "Midnight",
      description: "Dark and sleek",
      allowedTiers: ["pro"],
      businessTypes: ["Tech", "Gaming"],
      previewImageUrl: "https://via.placeholder.com/600x400?text=Midnight",
      sortOrder: 3,
      isActive: true,
    }
  ]).onConflictDoNothing();
  console.log("Templates seeded!");
}
main();
