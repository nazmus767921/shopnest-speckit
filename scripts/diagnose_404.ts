import dotenv from "dotenv"
import path from "path"
// Load env before importing db
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

import { db } from "../db"
import { products, merchants } from "../db/schema"
import { eq } from "drizzle-orm"

async function run() {
  const targetId = "a95c3f22-bc57-440b-b66a-bb9df5fbd59f"
  console.log(`Diagnosing product 404 for ID: ${targetId}`)

  // 1. Fetch product directly (without merchant filter or deletedAt filter)
  const [product] = await db.select().from(products).where(eq(products.id, targetId))

  if (!product) {
    console.log(`Product with ID ${targetId} DOES NOT EXIST in the database.`)
    return
  }

  console.log("Product found directly in database:")
  console.log(`- Name: ${product.name}`)
  console.log(`- Merchant ID: ${product.merchantId}`)
  console.log(`- Deleted At: ${product.deletedAt}`)
  console.log(`- Is Published: ${product.isPublished}`)

  // 2. Fetch merchant
  const [merchant] = await db.select().from(merchants).where(eq(merchants.id, product.merchantId))
  if (merchant) {
    console.log(`- Belongs to Merchant: ${merchant.name} (Owner ID: ${merchant.ownerId})`)
  } else {
    console.log(`- Merchant with ID ${product.merchantId} DOES NOT EXIST in the database.`)
  }

  // 3. Fetch all active merchants in the database to see what merchants are available
  const activeMerchants = await db.select().from(merchants)
  console.log("Active merchants in database:")
  for (const m of activeMerchants) {
    console.log(`  * ${m.name} (ID: ${m.id}, Owner: ${m.ownerId})`)
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
