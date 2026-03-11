export type LuggageType = 'backpack' | 'checked' | 'carry-on' | 'trunk' | 'other'

export interface Luggage {
  id: string
  userId: string
  name: string
  type: LuggageType
  icon?: string | null
  capacity?: number
  createdAt: Date
  updatedAt: Date
  tripLuggages?: TripLuggage[]
}

export interface TripLuggage {
  id: string
  tripId: string
  luggageId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  luggage: Luggage
  packingItems?: PackingItemWithLuggage[]
}

export interface PackingItemWithLuggage {
  id: string
  categoryId: string
  name: string
  quantity: number
  isPacked: boolean
  isCustom: boolean
  order: number
  tripLuggageId?: string | null
  tripLuggage?: TripLuggage
}

export interface CreateLuggageInput {
  name: string
  type: LuggageType
  icon?: string
  capacity?: number
}

export interface UpdateLuggageInput {
  name?: string
  type?: LuggageType
  icon?: string
  capacity?: number
}
