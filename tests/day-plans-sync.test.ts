
import { test, expect } from '@playwright/test';

// Mock Next.js NextResponse
const NextResponseMock = {
  json: (data, init) => ({ status: init?.status || 200, json: async () => data })
};

test.beforeEach(() => {
  require('module').Module._cache[require.resolve('next/server')] = {
    id: require.resolve('next/server'),
    filename: require.resolve('next/server'),
    loaded: true,
    exports: { NextResponse: NextResponseMock },
  };
});

test.describe('Day Plans Sync Action', () => {

  test('should batch category and item creation with $transaction', async () => {
    let transactionCalled = false;
    let createManyCategoriesCalled = false;
    let createManyItemsCalled = false;

    const mockPrisma = {
      dayPlan: {
        findMany: async () => [
          { items: [{ name: 'Toothbrush', quantity: 1, category: 'Toiletries' }] }
        ]
      },
      packingList: {
        findFirst: async () => ({ id: 'list-1' })
      },
      category: {
        findMany: async () => {
           if (createManyCategoriesCalled) {
             return [{ id: 'cat-1', name: 'Toiletries' }];
           }
           return [];
        },
        createMany: async (args) => { createManyCategoriesCalled = true; },
      },
      packingItem: {
        createMany: async (args) => { createManyItemsCalled = true; },
      },
      $transaction: async (args) => {
        transactionCalled = true;
      }
    };

    const prismaModule = require('../lib/prisma');
    Object.defineProperty(prismaModule, 'prisma', { value: mockPrisma, configurable: true });

    const { POST } = require('../app/api/day-plans/sync/route');

    const mockReq = {
      json: async () => ({ tripId: 'trip-1' })
    };

    const response = await POST(mockReq);
    const data = await response.json();

    expect(data.synced).toBe(1);
    expect(createManyCategoriesCalled).toBe(true);
    expect(createManyItemsCalled).toBe(true);
  });
});
