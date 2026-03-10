import type { DayPlanItem } from '@/types'

// Encode/decode inline tag items using existing DB columns — no migration needed.
// category='__tag__' signals an inline tag; name=tagId; notes=time (optional)

export const TAG_CATEGORY = '__tag__'

export function encodeTagItem(tagId: string, time?: string | null): Pick<DayPlanItem, 'name' | 'category' | 'notes' | 'quantity'> {
  return { name: tagId, category: TAG_CATEGORY, notes: time ?? null, quantity: 1 }
}

export function decodeItem(item: DayPlanItem): DayPlanItem {
  if (item.category === TAG_CATEGORY) {
    return { ...item, itemType: 'tag', tagId: item.name, time: item.notes ?? null }
  }
  return { ...item, itemType: 'item' }
}
