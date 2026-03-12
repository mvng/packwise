import { test, expect } from '@playwright/test';
import { POST } from '../app/api/day-plan-items/save-to-inventory/route';
import { prisma } from '../lib/prisma';
import * as auth from '../lib/supabase/server';
import { NextResponse } from 'next/server';

test.describe('Performance: save-to-inventory', () => {

  test('should batch category and item creation', async () => {
    let createManyCategoryCallCount = 0;
    let createManyItemCallCount = 0;
    let createCategoryCallCount = 0;
    let createItemCallCount = 0;

    const mockPrisma = {
      user: {
        findUnique: async () => ({ id: 'user-1' })
      },
      dayPlan: {
        findUnique: async () => ({
          id: 'dayplan-1',
          trip: { userId: 'user-1' },
          items: [
            { id: '1', name: 'Shoes', category: 'Clothing', quantity: 1 },
            { id: '2', name: 'Socks', category: 'Clothing', quantity: 2 },
            { id: '3', name: 'Laptop', category: 'Electronics', quantity: 1 }
          ]
        })
      },
      inventoryCategory: {
        findMany: async (args: any) => {
          if (args?.where?.name?.in) {
            return args.where.name.in.map((n: string, i: number) => ({ id: 'new-cat-' + i, name: n, order: i }));
          }
          return []; // first call to fetch all categories returns empty
        },
        createMany: async (args: any) => {
          createManyCategoryCallCount++;
          return { count: args.data.length };
        },
        create: async () => { createCategoryCallCount++; return {}; }
      },
      inventoryItem: {
        findMany: async () => [],
        groupBy: async () => [],
        createMany: async (args: any) => {
          createManyItemCallCount++;
          return { count: args.data.length };
        },
        create: async () => { createItemCallCount++; return {}; }
      }
    };

    Object.defineProperty(prisma, 'user', { value: mockPrisma.user });
    Object.defineProperty(prisma, 'dayPlan', { value: mockPrisma.dayPlan });
    Object.defineProperty(prisma, 'inventoryCategory', { value: mockPrisma.inventoryCategory });
    Object.defineProperty(prisma, 'inventoryItem', { value: mockPrisma.inventoryItem });

    // Mock Supabase Auth
    Object.defineProperty(auth, 'createClient', {
      value: async () => ({
        auth: { getUser: async () => ({ data: { user: { id: 'supabase-1' } } }) }
      })
    });

    const mockRequest = new Request('http://localhost/api/day-plan-items/save-to-inventory', {
      method: 'POST',
      body: JSON.stringify({ dayPlanId: 'dayplan-1' })
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(json.saved).toBe(3);

    // Assert batching works correctly
    expect(createManyCategoryCallCount).toBe(1);
    expect(createManyItemCallCount).toBe(1);

    // Assert sequential creation wasn't used
    expect(createCategoryCallCount).toBe(0);
    expect(createItemCallCount).toBe(0);
  });
});
