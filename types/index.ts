export type TripType = 'beach' | 'business' | 'hiking' | 'city' | 'skiing' | 'leisure'
export type TransportMode = 'flight' | 'car' | 'train' | 'cruise'

export interface Trip {
  id: string
  userId: string
  name?: string
  destination: string
  startDate: Date
  endDate: Date
  tripType: TripType
  transportMode?: TransportMode | null
  weather?: WeatherData
  notes?: string
  hotelConfirmationUrl?: string | null
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
  transportMode?: TransportMode | null
  generateSuggestions: boolean
  notes?: string
  hotelConfirmationUrl?: string | null
}

export interface DayPlan {
  id: string
  tripId: string
  date: Date
  label?: string | null
  items: DayPlanItem[]
}

export interface DayPlanItem {
  id: string
  dayPlanId: string
  name: string
  quantity: number
  category?: string | null
  notes?: string | null
  order: number
}

export interface UserSettings {
  homeCity: string | null
  homeCountry: string | null
}
