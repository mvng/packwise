import { test, expect } from '@playwright/test';

// Use require so we can mock the entire next/cache module before importing the file
const nextCacheMock = {
  revalidatePath: () => {}
};
test.beforeEach(() => {
  require('module').Module._cache[require.resolve('next/cache')] = {
    id: require.resolve('next/cache'),
    filename: require.resolve('next/cache'),
    loaded: true,
    exports: nextCacheMock,
  };
});

test.describe('Performance: addInventoryItemsToTrip', () => {

  test('should batch category creation', async () => {
    let createCallCount = 0;
    let createManyCallCount = 0;

    const mockPrisma = {
      trip: {
        findFirst: async () => ({ id: 'trip-1', userId: 'user-1' }),
      },
      inventoryItem: {
        findMany: async () => [
          { id: 'item-1', name: 'Item 1', quantity: 1, category: { name: 'Cat A', id: 'cat-a', userId: 'user-1' } },
          { id: 'item-2', name: 'Item 2', quantity: 1, category: { name: 'Cat B', id: 'cat-b', userId: 'user-1' } },
          { id: 'item-3', name: 'Item 3', quantity: 1, category: { name: 'Cat C', id: 'cat-c', userId: 'user-1' } },
          { id: 'item-4', name: 'Item 4', quantity: 1, category: { name: 'Cat D', id: 'cat-d', userId: 'user-1' } },
          { id: 'item-5', name: 'Item 5', quantity: 1, category: { name: 'Cat E', id: 'cat-e', userId: 'user-1' } },
        ],
      },
      packingList: {
        findFirst: async () => ({ id: 'list-1', tripId: 'trip-1' }),
        create: async () => ({ id: 'list-1', tripId: 'trip-1' }),
      },
      category: {
        findMany: async (args?: any) => {
          // In the optimized version, findMany will be called with the names of the created categories
          // We need to return the newly created categories with IDs so they can be grouped correctly
          if (args?.where?.name?.in) {
            return args.where.name.in.map((name: string, index: number) => ({
              id: 'new-cat-' + index,
              name,
              order: index
            }));
          }
          return []; // First findMany call to get existing categories returns empty
        },
        create: async (args: any) => {
          createCallCount++;
          return { id: 'new-cat-' + createCallCount, name: args.data.name, order: args.data.order };
        },
        createMany: async (args: any) => {
          createManyCallCount++;
          return { count: args.data.length };
        }
      },
      packingItem: {
        groupBy: async () => [],
        createMany: async () => ({ count: 5 }),
      }
    };

    const { prisma } = require('../lib/prisma');
    const auth = require('../lib/auth');
    const { addInventoryItemsToTrip } = require('../actions/inventory.actions');

    Object.defineProperty(prisma, 'trip', { value: mockPrisma.trip });
    Object.defineProperty(prisma, 'inventoryItem', { value: mockPrisma.inventoryItem });
    Object.defineProperty(prisma, 'packingList', { value: mockPrisma.packingList });
    Object.defineProperty(prisma, 'category', { value: mockPrisma.category });
    Object.defineProperty(prisma, 'packingItem', { value: mockPrisma.packingItem });
    Object.defineProperty(auth, 'getUserId', { value: async () => 'user-1' });

    await addInventoryItemsToTrip('trip-1', ['item-1', 'item-2', 'item-3', 'item-4', 'item-5']);

    // Our new assertions:
    expect(createCallCount).toBe(0);
    expect(createManyCallCount).toBe(1); // 1 for category, plus there's 1 for packingItem! Wait.
    // wait, createManyCallCount increments for category.createMany. packingItem has its own createMany mock.
    // Let's verify our assertion matches only category.createMany. Yes, we only tracked it on category mock.
  });
});
