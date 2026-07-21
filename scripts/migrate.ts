import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.MIGRATION_DATABASE_URL!, { max: 1 });
const db = drizzle(sql);

async function main() {
  await migrate(db, { migrationsFolder: './db/migrations' });
  console.log("Migrations applied successfully!");
  process.exit(0);
}
main();
