import { TripType } from '@/types'

interface PackingCategory {
  name: string
  order: number
  items: string[]
}

export function generatePackingList(
  tripType: TripType,
  duration: number
): PackingCategory[] {
  const base: PackingCategory[] = [
    {
      name: 'Documents',
      order: 0,
      items: ['Passport', 'ID / Driver License', 'Travel insurance', 'Boarding passes', 'Hotel confirmations'],
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
        items: [`Swimsuits (${Math.min(duration, 3)})`, `T-shirts (${qty})`, `Shorts (${Math.ceil(qty / 2)})`, `Underwear (${qty + 1})`, 'Light jacket', 'Flip flops', 'Sandals'],
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
        items: [`Dress shirts (${qty})`, `Dress pants (${Math.ceil(duration / 2)})`, `Suits (${Math.min(Math.ceil(duration / 3), 2)})`, 'Belt', 'Dress shoes', `Underwear (${qty + 1})`, `Socks (${qty + 1})`],
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
        items: [`Hiking pants (${Math.ceil(duration / 2)})`, `Moisture-wicking shirts (${qty})`, 'Fleece jacket', 'Rain jacket', 'Hiking boots', `Hiking socks (${qty + 2})`],
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
        items: [`T-shirts (${qty})`, `Pants (${Math.ceil(duration / 2)})`, 'Comfortable walking shoes', 'Light jacket', `Underwear (${qty + 1})`, 'Dress outfit'],
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
  }

  return [...base, ...specific[tripType]]
}
