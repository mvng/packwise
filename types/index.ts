export type TripType = 'beach' | 'business' | 'hiking' | 'city' | 'skiing' | 'leisure'

export interface Trip {
  id: string
  userId: string
  name?: string
  destination: string
  startDate: Date
  endDate: Date
  tripType: TripType
  weather?: WeatherData
  notes?: string
  createdAt: Date
  updatedAt: Date
  packingLists?: PackingList[]
}

export interface PackingList {
  id: string
  tripId: string
  name: string
  createdAt: Date
  updatedAt: Date
  categories: Category[]
}

export interface Category {
  id: string
  packingListId: string
  name: string
  order: number
  items: PackingItem[]
}

export interface PackingItem {
  id: string
  categoryId: string
  name: string
  quantity: number
  isPacked: boolean
  isCustom: boolean
  order: number
}

export interface WeatherData {
  temp: number
  condition: string
  icon: string
}

export interface LocalTrip {
  id: string
  destination: string
  startDate: string
  endDate: string
  tripType: TripType
  categories: LocalCategory[]
  createdAt: string
}

export interface LocalCategory {
  id: string
  name: string
  order: number
  items: LocalPackingItem[]
}

export interface LocalPackingItem {
  id: string
  name: string
  quantity: number
  isPacked: boolean
  isCustom: boolean
  order: number
}

export interface CreateTripInput {
  name: string
  destination: string
  startDate?: Date
  endDate?: Date
  tripType: string
  generateSuggestions: boolean
  notes?: string
}
