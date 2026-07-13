import { db } from "../db"
import { sql } from "drizzle-orm"

async function main() {
  try {
    console.log("Adding RLS policies for 'media' bucket...")

    // 1. Allow public select (download/read)
    await db.execute(sql`
      CREATE POLICY "Public Access" 
      ON storage.objects FOR SELECT 
      USING ( bucket_id = 'media' );
    `)
    console.log("Added SELECT policy")

    // 2. Allow public insert (upload)
    await db.execute(sql`
      CREATE POLICY "Public Uploads" 
      ON storage.objects FOR INSERT 
      WITH CHECK ( bucket_id = 'media' );
    `)
    console.log("Added INSERT policy")

    // 3. Allow public update
    await db.execute(sql`
      CREATE POLICY "Public Updates" 
      ON storage.objects FOR UPDATE 
      USING ( bucket_id = 'media' );
    `)
    console.log("Added UPDATE policy")

    // 4. Allow public delete
    await db.execute(sql`
      CREATE POLICY "Public Deletes" 
      ON storage.objects FOR DELETE 
      USING ( bucket_id = 'media' );
    `)
    console.log("Added DELETE policy")

    console.log("Successfully added all policies.")
  } catch (err: any) {
    if (err.message.includes("already exists")) {
      console.log("Policies already exist.")
    } else {
      console.error("Error:", err)
    }
  }
  process.exit(0)
}

main()
