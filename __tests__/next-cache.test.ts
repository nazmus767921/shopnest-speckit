import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMerchantById } from '../db/queries/merchants';

// Mock dependencies
vi.mock('../db/queries/merchants', () => ({
  getMerchantById: vi.fn(),
}));

// Mock Next.js cache APIs
vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn) => fn),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

import { getCachedMerchantById } from '../lib/cache/merchants';

describe('Next.js Cache Wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call underlying getMerchantById', async () => {
    const mockMerchant = { id: 'm1', name: 'Test' };
    (getMerchantById as any).mockResolvedValue(mockMerchant as any);

    const result = await getCachedMerchantById('m1');

    expect(getMerchantById).toHaveBeenCalledWith('m1');
    expect(result).toEqual(mockMerchant);
  });
});
