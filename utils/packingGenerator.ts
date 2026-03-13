import { TripType, TransportMode } from '@/types'

interface PackingCategory {
  name: string
  order: number
  items: string[]
}

// Approximate coords for common cities used for domestic proximity detection.
// In production you'd geocode homeCity dynamically via an API.
const CITY_COORDS: Record<string, [number, number]> = {
  'new york': [40.7128, -74.006],
  'new york city': [40.7128, -74.006],
  'nyc': [40.7128, -74.006],
  'los angeles': [34.0522, -118.2437],
  'la': [34.0522, -118.2437],
  'chicago': [41.8781, -87.6298],
  'san francisco': [37.7749, -122.4194],
  'sf': [37.7749, -122.4194],
  'seattle': [47.6062, -122.3321],
  'austin': [30.2672, -97.7431],
  'miami': [25.7617, -80.1918],
  'denver': [39.7392, -104.9903],
  'boston': [42.3601, -71.0589],
  'san diego': [32.7157, -117.1611],
  'escondido': [33.1192, -117.0864],
  'portland': [45.5051, -122.675],
  'atlanta': [33.749, -84.388],
  'dallas': [32.7767, -96.797],
  'houston': [29.7604, -95.3698],
  'phoenix': [33.4484, -112.074],
  'las vegas': [36.1699, -115.1398],
  'london': [51.5074, -0.1278],
  'paris': [48.8566, 2.3522],
  'tokyo': [35.6762, 139.6503],
  'toronto': [43.6532, -79.3832],
  'sydney': [-33.8688, 151.2093],
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

/**
 * Haversine distance in kilometers between two lat/lng pairs.
 */
function haversineKm(
  [lat1, lon1]: [number, number],
  [lat2, lon2]: [number, number]
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Returns true if the destination appears to be a short domestic drive
 * (< 500 km from homeCity, same country context).
 * Falls back to false when either city is unknown.
 */
export function isDomesticDrive(
  destination: string,
  homeCity: string | null | undefined
): boolean {
  if (!homeCity) return false
  const homeLower = homeCity.toLowerCase().trim()
  const destLower = destination.toLowerCase().trim()

  const homeCoords = CITY_COORDS[homeLower]
  // Try exact match first, then check if destination string contains a known city
  let destCoords = CITY_COORDS[destLower]
  if (!destCoords) {
    for (const [city, coords] of Object.entries(CITY_COORDS)) {
      if (destLower.includes(city)) {
        destCoords = coords
        break
      }
    }
  }

  if (!homeCoords || !destCoords) return false
  return haversineKm(homeCoords, destCoords) < 500
}

const TRANSPORT_ITEMS: Record<TransportMode, string[]> = {
  flight: [
    'Boarding pass / e-ticket',
    'Passport / ID',
    'Travel pillow',
    'Noise-cancelling headphones',
    'Eye mask',
    'Earplugs',
    'Snacks for flight',
    'Reusable water bottle (empty for security)',
    'Lip balm',
    'Hand sanitizer',
    'Carry-on toiletries (100ml or less)',
    'TSA-approved liquids bag',
  ],
  car: [
    'Driver\'s license',
    'Car insurance & registration',
    'Road trip snacks',
    'Reusable water bottles',
    'Phone car mount',
    'Car charger / USB adapter',
    'Sunglasses',
    'Roadside emergency kit',
    'Paper maps / offline maps downloaded',
    'Trash bag for car',
    'Blanket',
  ],
  train: [
    'Train tickets / rail pass',
    'Passport / ID',
    'Neck pillow',
    'Headphones',
    'Snacks',
    'Reusable water bottle',
    'Book / e-reader',
    'Power bank',
    'Small day bag',
  ],
  cruise: [
    'Passport',
    'Cruise booking confirmation',
    'Formal dinner outfit',
    'Seasickness medication',
    'Sunscreen SPF 50+',
    'Swimsuit (multiple)',
    'Waterproof sandals',
    'Lanyard for cruise card',
    'Reusable water bottle',
    'Power strip (no surge protector)',
    'Insulated tumbler',
    'Day bag for port excursions',
  ],
}

export function generatePackingList(
  tripType: TripType,
  duration: number,
  transportMode?: TransportMode | null,
  options?: {
    homeCity?: string | null
    destination?: string
    hotelConfirmationUrl?: string | null
  }
): PackingCategory[] {
  const nearHome =
    options?.homeCity && options?.destination
      ? isDomesticDrive(options.destination, options.homeCity)
      : false

  // Build documents list — omit passport for close domestic trips
  const docItems = nearHome
    ? ['ID / Driver License', 'Travel insurance', 'Hotel confirmations']
    : ['Passport', 'ID / Driver License', 'Travel insurance', 'Boarding passes', 'Hotel confirmations']

  // If a hotel confirmation URL was saved, swap the static item for a clickable label hint
  if (options?.hotelConfirmationUrl) {
    const idx = docItems.indexOf('Hotel confirmations')
    if (idx !== -1) {
      docItems[idx] = 'Hotel confirmation (saved online ✓)'
    }
  }

  const base: PackingCategory[] = [
    {
      name: 'Documents',
      order: 0,
      items: docItems,
    },
    {
      name: 'Electronics',
      order: 1,
      items: ['Phone', 'Phone charger', 'Power bank', 'Headphones', 'Laptop', 'Laptop charger'],
    },
    {
      name: 'Toiletries',
      order: 2,
      items: ['Toothbrush', 'Toothpaste', 'Deodorant', 'Shampoo', 'Body wash', 'Razor', 'Sunscreen', 'Medications'],
    },
  ]

  const qty = Math.min(duration + 1, 7)

  const specific: Record<TripType, PackingCategory[]> = {
    beach: [
      {
        name: 'Clothing',
        order: 3,
        items: [`Swimsuits (${Math.min(qty, 3)})`, `T-shirts (${qty})`, `Shorts (${Math.ceil(qty / 2)})`, `Underwear (${qty + 1})`, 'Light jacket', 'Flip flops', 'Sandals'],
      },
      {
        name: 'Beach Accessories',
        order: 4,
        items: ['Sunglasses', 'Beach towel', 'Beach bag', 'Hat', 'Sunscreen SPF 50+', 'After-sun lotion', 'Water bottle'],
      },
    ],
    business: [
      {
        name: 'Clothing',
        order: 3,
        items: [`Dress shirts (${qty})`, `Dress pants (${Math.ceil(qty / 2)})`, `Suits (${Math.min(Math.ceil(qty / 3), 2)})`, 'Belt', 'Dress shoes', `Underwear (${qty + 1})`, `Socks (${qty + 1})`],
      },
      {
        name: 'Work Essentials',
        order: 4,
        items: ['Business cards', 'Notebook', 'Pens', 'Laptop', 'USB drive'],
      },
    ],
    hiking: [
      {
        name: 'Clothing',
        order: 3,
        items: [`Hiking pants (${Math.ceil(qty / 2)})`, `Moisture-wicking shirts (${qty})`, 'Fleece jacket', 'Rain jacket', 'Hiking boots', `Hiking socks (${qty + 2})`],
      },
      {
        name: 'Hiking Gear',
        order: 4,
        items: ['Backpack', 'Water bottles', 'First aid kit', 'Headlamp', 'Multi-tool', 'Sunscreen', 'Insect repellent'],
      },
    ],
    city: [
      {
        name: 'Clothing',
        order: 3,
        items: [`T-shirts (${qty})`, `Pants (${Math.ceil(qty / 2)})`, 'Comfortable walking shoes', 'Light jacket', `Underwear (${qty + 1})`, 'Dress outfit'],
      },
      {
        name: 'City Essentials',
        order: 4,
        items: ['Day backpack', 'Water bottle', 'City map', 'Camera', 'Umbrella', 'Sunglasses'],
      },
    ],
    skiing: [
      {
        name: 'Clothing',
        order: 3,
        items: ['Ski jacket', 'Ski pants', 'Base layers top & bottom', 'Fleece mid-layer', 'Warm socks', 'Gloves', 'Neck warmer', 'Beanie'],
      },
      {
        name: 'Ski Gear',
        order: 4,
        items: ['Ski goggles', 'Helmet', 'Hand warmers', 'Lip balm SPF', 'Sunscreen high SPF', 'After-ski boots'],
      },
    ],
    leisure: [
      {
        name: 'Clothing',
        order: 3,
        items: [`T-shirts (${qty})`, `Casual pants (${Math.ceil(qty / 2)})`, 'Comfortable shoes', 'Sneakers', `Underwear (${qty + 1})`, 'Light jacket', 'Sleepwear'],
      },
      {
        name: 'Leisure Essentials',
        order: 4,
        items: ['Book / E-reader', 'Headphones', 'Sunglasses', 'Day bag', 'Water bottle', 'Snacks', 'Camera'],
      },
    ],
  }

  const categories = [...base, ...specific[tripType]]

  if (transportMode && TRANSPORT_ITEMS[transportMode]) {
    const label: Record<TransportMode, string> = {
      flight: 'Flight Essentials',
      car: 'Road Trip Essentials',
      train: 'Train Essentials',
      cruise: 'Cruise Essentials',
    }
    categories.push({
      name: label[transportMode],
      order: categories.length,
      items: TRANSPORT_ITEMS[transportMode],
    })
  }

  return categories
}
