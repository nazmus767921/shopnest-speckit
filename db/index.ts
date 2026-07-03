import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL || ""

const client = postgres(connectionString, {
  prepare: false,
  connect_timeout: 10,
  max: 10,
  idle_timeout: 30,
})
export const db = drizzle(client, { schema })
