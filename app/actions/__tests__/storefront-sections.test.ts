import { expect, test, describe, vi } from 'vitest'

// Mocking dependencies since it's a server action
vi.mock('@/lib/auth/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({ user: { id: 'user_1' } })
    }
  }
}))

vi.mock('@/db/queries/merchants', () => ({
  getMerchantByOwnerId: vi.fn().mockResolvedValue({ id: 'merchant_1' })
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Map())
}))

vi.mock('@/lib/redis/client', () => ({
  redis: {
    del: vi.fn().mockResolvedValue(true)
  }
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn()
}))

vi.mock('@/db/queries/storefront-sections', () => ({
  upsertStorefrontSections: vi.fn().mockResolvedValue(true)
}))

import { saveStorefrontSectionsAction } from '../storefront-sections'
import { upsertStorefrontSections } from '@/db/queries/storefront-sections'
import { StorefrontSection } from '@/lib/storefront-sections/types'
import { SECTION_SORT_ORDER } from '@/lib/storefront-sections/section-catalog'

describe('saveStorefrontSectionsAction', () => {
  test('core sections reject isVisible: false', async () => {
    const inputSections = [
      {
        sectionKey: 'hero', // core
        content: { title: 'Test' },
        isVisible: false,
        sortOrder: 0
      }
    ] as StorefrontSection[]

    const res = await saveStorefrontSectionsAction(inputSections)
    expect(res.success).toBe(true)

    const savedArgs = vi.mocked(upsertStorefrontSections).mock.calls[0][1]
    const heroSaved = savedArgs.find((s: any) => s.sectionKey === 'hero')
    
    // Should override isVisible to true for core sections
    expect(heroSaved.isVisible).toBe(true)
  })

  test('optional sections accept toggle', async () => {
    vi.mocked(upsertStorefrontSections).mockClear()

    const inputSections = [
      {
        sectionKey: 'announcement_bar', // optional
        content: { text: 'Test' },
        isVisible: false,
        sortOrder: 0
      }
    ] as StorefrontSection[]

    const res = await saveStorefrontSectionsAction(inputSections)
    expect(res.success).toBe(true)

    const savedArgs = vi.mocked(upsertStorefrontSections).mock.calls[0][1]
    const announcementSaved = savedArgs.find((s: any) => s.sectionKey === 'announcement_bar')
    
    // Should accept isVisible: false for optional sections
    expect(announcementSaved.isVisible).toBe(false)
  })

  test('sortOrder is overridden by catalog', async () => {
    vi.mocked(upsertStorefrontSections).mockClear()

    const inputSections = [
      {
        sectionKey: 'hero',
        content: { title: 'Test' },
        isVisible: true,
        sortOrder: 99 // Invalid sort order
      }
    ] as StorefrontSection[]

    await saveStorefrontSectionsAction(inputSections)

    const savedArgs = vi.mocked(upsertStorefrontSections).mock.calls[0][1]
    const heroSaved = savedArgs.find((s: any) => s.sectionKey === 'hero')
    
    // Should override to the correct catalog sort order
    expect(heroSaved.sortOrder).toBe(SECTION_SORT_ORDER.hero)
  })
})
