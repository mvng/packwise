export type InventoryItemData = {
  id: string
  categoryId: string
  name: string
  quantity: number
  notes: string | null
  isFavorite: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

export type InventoryCategoryData = {
  id: string
  userId: string
  name: string
  order: number
  createdAt: Date
  updatedAt: Date
  items: InventoryItemData[]
}

export type ItemFormData = {
  name: string
  quantity: number
  notes: string
}
