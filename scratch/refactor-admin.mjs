import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'app/actions/admin.ts');
let content = fs.readFileSync(file, 'utf-8');

// Ensure revalidateTag is imported
if (!content.includes('revalidateTag')) {
  content = content.replace('import { revalidatePath }', 'import { revalidatePath, revalidateTag }');
}

// Add revalidateTag calls after invalidateProxyCache
content = content.replace(
  /await invalidateProxyCache\(([^)]+)\)/g,
  (match, p1) => {
    return `${match}\n    revalidateTag(\`plan-\${${p1}}\`)\n    revalidateTag(\`merchant-\${${p1}}\`)`;
  }
);

fs.writeFileSync(file, content, 'utf-8');
console.log('Done admin.ts refactor');
