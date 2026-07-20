import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function main() {
  // Use MIGRATION_DATABASE_URL if available as a direct connection
  if (process.env.MIGRATION_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.MIGRATION_DATABASE_URL
  }

  // Dynamically import to ensure process.env.DATABASE_URL is set first
  const { db } = await import("../db")
  const { user } = await import("../db/schema")
  const { auth } = await import("../lib/auth/auth")
  const { eq } = await import("drizzle-orm")

  const adminEmail = "admin@shopnest.com.bd"
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminPass123!"

  console.log("Checking if admin user exists...")
  const existing = await db.query.user.findFirst({
    where: eq(user.email, adminEmail),
  })

  if (existing) {
    console.log("Admin user already exists. Updating role to admin...")
    await db.update(user).set({ role: "admin" }).where(eq(user.id, existing.id))
    console.log("Admin user updated successfully!")
    return
  }

  console.log("Creating admin user via Better Auth server API...")
  const newUser = await auth.api.signUpEmail({
    body: {
      email: adminEmail,
      password: adminPassword,
      name: "ShopNest Admin",
    },
  })

  if (newUser && newUser.user) {
    console.log("Admin user created. Setting role to 'admin' in database...")
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, newUser.user.id))
    console.log("Admin user initialized successfully!")
    console.log(`Email: ${adminEmail}`)
    console.log(`Password: ${adminPassword}`)
  } else {
    console.error("Failed to create admin user.")
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
