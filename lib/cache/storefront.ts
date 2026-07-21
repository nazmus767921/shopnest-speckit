import { cacheTag, cacheLife } from 'next/cache';
import { db } from '@/db';
import { merchantThemes, themes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getCachedMerchantTheme(merchantId: string) {
  "use cache";
  cacheLife('max');
  cacheTag(`storefront-${merchantId}`);
  
  const result = await db.select({
    activeLayout: merchantThemes.activeLayout,
    themeId: merchantThemes.themeId,
    cssVariables: themes.cssVariables
  })
  .from(merchantThemes)
  .leftJoin(themes, eq(merchantThemes.themeId, themes.id))
  .where(eq(merchantThemes.merchantId, merchantId))
  .limit(1);
  
  if (result.length > 0) {
    return result[0];
  }
  
  // Fallback defaults
  return {
    activeLayout: [],
    themeId: "elegance",
    cssVariables: {}
  };
}
