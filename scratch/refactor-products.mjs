import fs from 'fs';
import path from 'path';

function processFile(filename, tagPattern) {
  const filePath = path.join(process.cwd(), 'app/actions', filename);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filename}, not found`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf-8');

  // Ensure revalidateTag is imported
  if (!content.includes('revalidateTag')) {
    content = content.replace('import { revalidatePath }', 'import { revalidatePath, revalidateTag }');
  }

  // Replace revalidatePath("/dashboard/...") with revalidateTag and revalidatePath
  // But wait, it's easier to just append revalidateTag(tag) before the first revalidatePath in each block.
  // Actually, I can just replace `revalidatePath("/dashboard/products")` with `revalidateTag(\`products-\${merchant.id}\`); revalidatePath("/dashboard/products")`

  // For products:
  if (filename === 'products.ts') {
    content = content.replace(/revalidatePath\("\/dashboard\/products"\)/g, 'revalidateTag(`products-${merchant.id}`);\n    revalidatePath("/dashboard/products")');
  }

  // For categories:
  if (filename === 'categories.ts') {
    content = content.replace(/revalidatePath\("\/dashboard\/categories"\)/g, 'revalidateTag(`categories-${merchant.id}`);\n    revalidatePath("/dashboard/categories")');
  }
  
  // For shipping:
  if (filename === 'shipping.ts' || filename === 'shippingZones.ts') {
    content = content.replace(/revalidatePath\("\/dashboard\/settings\/shipping"\)/g, 'revalidateTag(`shipping-${merchant.id}`);\n    revalidatePath("/dashboard/settings/shipping")');
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Done ${filename}`);
}

processFile('products.ts');
processFile('categories.ts');
processFile('shippingZones.ts');
processFile('settings.ts'); // shipping zones might be in settings? Let's try shipping.ts or shippingZones.ts
