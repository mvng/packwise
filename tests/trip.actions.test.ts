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

test.describe('Trip Actions', () => {

  test('createTrip should create a trip and return success', async () => {
    let createTripCalled = false;
    let createPackingListCalled = false;

    const mockPrisma = {
      user: {
        findUnique: async () => ({ homeCity: 'London' })
      },
      trip: {
        create: async (args: any) => {
          createTripCalled = true;
          return { id: 'trip-1', ...args.data };
        }
      },
      packingList: {
        create: async (args: any) => {
          createPackingListCalled = true;
          return { id: 'list-1', ...args.data };
        }
      }
    };

    const prismaModule = require('../lib/prisma');
    const auth = require('../lib/auth');
    const { createTrip } = require('../actions/trip.actions');

    // Rather than Object.defineProperty directly on the PrismaClient proxy,
    // we can re-assign properties on the `prisma` object, or redefine it.
    Object.defineProperty(prismaModule, 'prisma', { value: mockPrisma, configurable: true });
    Object.defineProperty(auth, 'getUserId', { value: async () => 'user-1', configurable: true });

    const input = {
      name: 'Summer Vacation',
      destination: 'Paris',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-07-10'),
      tripType: 'leisure',
      transportMode: 'flight',
      generateSuggestions: true,
    };

    const result = await createTrip(input);

    expect(result.success).toBe(true);
    expect(result.tripId).toBe('trip-1');
    expect(createTripCalled).toBe(true);
    expect(createPackingListCalled).toBe(true);
  });

  test('updateTrip should update an existing trip', async () => {
    let updateTripCalled = false;

    const mockPrisma = {
      trip: {
        findFirst: async () => ({ id: 'trip-1', userId: 'user-1' }),
        update: async (args: any) => {
          updateTripCalled = true;
          return { id: 'trip-1', ...args.data };
        }
      }
    };

    const prismaModule = require('../lib/prisma');
    const auth = require('../lib/auth');
    const { updateTrip } = require('../actions/trip.actions');

    Object.defineProperty(prismaModule, 'prisma', { value: mockPrisma, configurable: true });
    Object.defineProperty(auth, 'getUserId', { value: async () => 'user-1', configurable: true });

    const input = {
      name: 'Updated Summer Vacation',
      destination: 'Berlin',
    };

    const result = await updateTrip('trip-1', input);

    expect(result.success).toBe(true);
    expect(updateTripCalled).toBe(true);
  });

  test('getUserTrips should fetch user trips', async () => {
    const mockPrisma = {
      trip: {
        findMany: async () => [
          { id: 'trip-1', name: 'Trip 1' },
          { id: 'trip-2', name: 'Trip 2' }
        ]
      },
      packingList: {
        findMany: async () => []
      },
      category: {
        findMany: async () => []
      },
      packingItem: {
        findMany: async () => []
      }
    };

    const prismaModule = require('../lib/prisma');
    const auth = require('../lib/auth');
    const { getUserTrips } = require('../actions/trip.actions');

    Object.defineProperty(prismaModule, 'prisma', { value: mockPrisma, configurable: true });
    Object.defineProperty(auth, 'getUserId', { value: async () => 'user-1', configurable: true });

    const result = await getUserTrips();

    expect(result.trips).toBeDefined();
    expect(result.trips?.length).toBe(2);
    expect(result.trips?.[0].id).toBe('trip-1');
  });

  test('getTripById should fetch a specific trip', async () => {
    const mockPrisma = {
      trip: {
        findFirst: async () => ({ id: 'trip-1', name: 'Specific Trip' })
      },
      packingList: {
        findMany: async () => ([])
      },
      category: {
        findMany: async () => ([])
      },
      packingItem: {
        findMany: async () => ([])
      }
    };

    const prismaModule = require('../lib/prisma');
    const auth = require('../lib/auth');
    const { getTripById } = require('../actions/trip.actions');

    Object.defineProperty(prismaModule, 'prisma', { value: mockPrisma, configurable: true });
    Object.defineProperty(auth, 'getUserId', { value: async () => 'user-1', configurable: true });

    const result = await getTripById('trip-1');

    expect(result.trip).toBeDefined();
    expect(result.trip?.name).toBe('Specific Trip');
  });

  test('deleteTrip should delete an existing trip', async () => {
    let deleteTripCalled = false;

    const mockPrisma = {
      trip: {
        delete: async () => {
          deleteTripCalled = true;
          return { id: 'trip-1' };
        }
      }
    };

    const prismaModule = require('../lib/prisma');
    const auth = require('../lib/auth');
    const { deleteTrip } = require('../actions/trip.actions');

    Object.defineProperty(prismaModule, 'prisma', { value: mockPrisma, configurable: true });
    Object.defineProperty(auth, 'getUserId', { value: async () => 'user-1', configurable: true });

    const result = await deleteTrip('trip-1');

    expect(result.success).toBe(true);
    expect(deleteTripCalled).toBe(true);
  });

  test('getSharedTripById should fetch a shared trip regardless of userId', async () => {
    const mockPrisma = {
      trip: {
        findUnique: async () => ({ id: 'trip-shared-1', name: 'Shared Trip' })
      },
      packingList: {
        findMany: async () => []
      },
      category: {
        findMany: async () => []
      },
      packingItem: {
        findMany: async () => []
      }
    };

    const prismaModule = require('../lib/prisma');
    const { getSharedTripById } = require('../actions/trip.actions');

    Object.defineProperty(prismaModule, 'prisma', { value: mockPrisma, configurable: true });

    const result = await getSharedTripById('trip-shared-1');

    expect(result.trip).toBeDefined();
    expect(result.trip?.name).toBe('Shared Trip');
  });

  test('forkTrip should copy an existing trip to the users account', async () => {
    let createTripCalled = false;

    const mockPrisma = {
      trip: {
        findUnique: async () => ({
          id: 'trip-source-1',
          userId: 'user-2', // Different from current user
          name: 'Source Trip',
          destination: 'Tokyo',
        }),
        create: async (args: any) => {
          createTripCalled = true;
          return { id: 'trip-new-1', ...args.data };
        }
      },
      packingList: {
        findMany: async () => [
          { id: 'list-1', name: 'List 1' }
        ]
      },
      category: {
        findMany: async () => [
          { id: 'cat-1', packingListId: 'list-1', name: 'Docs', order: 0 }
        ]
      },
      packingItem: {
        findMany: async () => [
          { id: 'item-passport', categoryId: 'cat-1', name: 'Passport', quantity: 1, isCustom: false, order: 0 }
        ]
      }
    };

    const prismaModule = require('../lib/prisma');
    const auth = require('../lib/auth');
    const { forkTrip } = require('../actions/trip.actions');

    Object.defineProperty(prismaModule, 'prisma', { value: mockPrisma, configurable: true });
    Object.defineProperty(auth, 'getUserId', { value: async () => 'user-1', configurable: true });

    const result = await forkTrip('trip-source-1', { 'item-passport': true });

    expect(result.success).toBe(true);
    expect(result.tripId).toBe('trip-new-1');
    expect(createTripCalled).toBe(true);
  });
});
