import { cacheTag, cacheLife } from 'next/cache';
import { getActiveTemplates } from '@/db/queries/templates';

export async function getCachedActiveTemplates() {
  "use cache";
  cacheLife('max');
  cacheTag('templates');
  return getActiveTemplates();
}
