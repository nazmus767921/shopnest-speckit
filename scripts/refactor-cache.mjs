import fs from 'fs';
import path from 'path';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        results.push(filePath);
      }
    }
  }
  return results;
}

const replacements = [
  {
    regex: /import \{([^}]*)\bgetMerchantById\b([^}]*)\} from ["']@\/db\/queries\/merchants["']/g,
    replaceFn: (match, p1, p2) => {
      const rest = (p1 + p2).replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '').replace(/\s*,\s*$/, '').trim();
      let res = `import { getCachedMerchantById } from "@/lib/cache/merchants"`;
      if (rest) res += `\nimport { ${rest} } from "@/db/queries/merchants"`;
      return res;
    },
    fnRegex: /\bgetMerchantById\b/g,
    fnReplace: 'getCachedMerchantById'
  },
  {
    regex: /import \{([^}]*)\bgetStorefrontSections\b([^}]*)\} from ["']@\/db\/queries\/storefront-sections["']/g,
    replaceFn: (match, p1, p2) => {
      const rest = (p1 + p2).replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '').replace(/\s*,\s*$/, '').trim();
      let res = `import { getCachedStorefrontSections } from "@/lib/cache/storefront"`;
      if (rest) res += `\nimport { ${rest} } from "@/db/queries/storefront-sections"`;
      return res;
    },
    fnRegex: /\bgetStorefrontSections\b/g,
    fnReplace: 'getCachedStorefrontSections'
  },
  {
    regex: /import \{([^}]*)\bgetCategories\b([^}]*)\} from ["']@\/db\/queries\/categories["']/g,
    replaceFn: (match, p1, p2) => {
      const rest = (p1 + p2).replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '').replace(/\s*,\s*$/, '').trim();
      let res = `import { getCachedCategories } from "@/lib/cache/categories"`;
      if (rest) res += `\nimport { ${rest} } from "@/db/queries/categories"`;
      return res;
    },
    fnRegex: /\bgetCategories\b/g,
    fnReplace: 'getCachedCategories'
  },
  {
    regex: /import \{([^}]*)\bgetPublishedProducts\b([^}]*)\} from ["']@\/db\/queries\/products["']/g,
    replaceFn: (match, p1, p2) => {
      const rest = (p1 + p2).replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '').replace(/\s*,\s*$/, '').trim();
      let res = `import { getCachedPublishedProducts } from "@/lib/cache/products"`;
      if (rest) res += `\nimport { ${rest} } from "@/db/queries/products"`;
      return res;
    },
    fnRegex: /\bgetPublishedProducts\b/g,
    fnReplace: 'getCachedPublishedProducts'
  },
  {
    regex: /import \{([^}]*)\bgetPublishedProductBySlug\b([^}]*)\} from ["']@\/db\/queries\/products["']/g,
    replaceFn: (match, p1, p2) => {
      const rest = (p1 + p2).replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '').replace(/\s*,\s*$/, '').trim();
      let res = `import { getCachedPublishedProductBySlug } from "@/lib/cache/products"`;
      if (rest) res += `\nimport { ${rest} } from "@/db/queries/products"`;
      return res;
    },
    fnRegex: /\bgetPublishedProductBySlug\b/g,
    fnReplace: 'getCachedPublishedProductBySlug'
  },
  {
    regex: /import \{([^}]*)\bgetShippingZones\b([^}]*)\} from ["']@\/db\/queries\/shippingZones["']/g,
    replaceFn: (match, p1, p2) => {
      const rest = (p1 + p2).replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '').replace(/\s*,\s*$/, '').trim();
      let res = `import { getCachedShippingZones } from "@/lib/cache/shipping"`;
      if (rest) res += `\nimport { ${rest} } from "@/db/queries/shippingZones"`;
      return res;
    },
    fnRegex: /\bgetShippingZones\b/g,
    fnReplace: 'getCachedShippingZones'
  },
  {
    regex: /import \{([^}]*)\bgetMerchantPlan\b([^}]*)\} from ["']@\/lib\/plans\/getPlan["']/g,
    replaceFn: (match, p1, p2) => {
      const rest = (p1 + p2).replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '').replace(/\s*,\s*$/, '').trim();
      let res = `import { getCachedMerchantPlan } from "@/lib/cache/plans"`;
      if (rest) res += `\nimport { ${rest} } from "@/lib/plans/getPlan"`;
      return res;
    },
    fnRegex: /\bgetMerchantPlan\b/g,
    fnReplace: 'getCachedMerchantPlan'
  }
];

const files = getFiles('app');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;

  for (const rep of replacements) {
    if (rep.regex.test(content)) {
      content = content.replace(rep.regex, rep.replaceFn);
      content = content.replace(rep.fnRegex, rep.fnReplace);
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
}
