import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.MIGRATION_DATABASE_URL!, { max: 1 });

async function main() {
  const files = ['0037_true_pet_avengers.sql', '0038_ambiguous_kate_bishop.sql'];
  for (const file of files) {
    const filePath = path.join(process.cwd(), 'db/migrations', file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Applying ${file}...`);
    // Split by statement breakpoint if necessary or just run it directly
    // Postgres handles multiple statements in one query if it's not parameterized
    try {
      await sql.unsafe(content);
      console.log(`Success: ${file}`);
    } catch(err) {
      console.error(`Error applying ${file}:`, err);
    }
  }
  process.exit(0);
}
main();
