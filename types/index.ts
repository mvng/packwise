export type TripType = 'business' | 'leisure' | 'adventure' | 'beach' | 'city' | 'camping'

export interface CreateTripInput {
  name?: string
  destination: string
  startDate?: Date
  endDate?: Date
  tripType: TripType
  notes?: string
  generateSuggestions?: boolean
}

export interface InventoryCategory {
  id: string
  userId: string
  name: string
  icon: string | null
  order: number
  createdAt: Date
  updatedAt: Date
  items?: InventoryItem[]
}

export interface InventoryItem {
  id: string
  categoryId: string
  name: string
  brand: string | null
  size: string | null
  notes: string | null
  imageUrl: string | null
  quantity: number
  isFavorite: boolean
  tags: string[]
  timesUsed: number
  order: number
  createdAt: Date
  updatedAt: Date
  category?: InventoryCategory
}
