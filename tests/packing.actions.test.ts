import { test, expect } from '@playwright/test';

// Mock next/cache
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

test.describe('Packing Actions', () => {

  test('toggleItemPacked should update item packed status', async () => {
    let updateData: any = null;

    const mockPrisma = {
      packingItem: {
        update: async (args: any) => {
          updateData = args.data;
          return { id: 'item-1', ...args.data };
        }
      }
    };

    const prismaModule = require('../lib/prisma');
    const { toggleItemPacked } = require('../actions/packing.actions');

    Object.defineProperty(prismaModule, 'prisma', { value: mockPrisma, configurable: true });

    const result = await toggleItemPacked('item-1', true, 'trip-1');

    expect(result.success).toBe(true);
    expect(updateData.isPacked).toBe(true);
  });

  test('togglePackLast should update packLast property if authorized', async () => {
    let updateData: any = null;

    const mockPrisma = {
      packingItem: {
        update: async (args: any) => {
          updateData = args.data;
          return { id: 'item-1', ...args.data };
        }
      }
    };

    const mockAuth = {
      createClient: async () => ({
        auth: {
          getUser: async () => ({ data: { user: { id: 'user-1' } } })
        }
      })
    };

    const prismaModule = require('../lib/prisma');
    const authServer = require('../lib/supabase/server');
    const { togglePackLast } = require('../actions/packing.actions');

    Object.defineProperty(prismaModule, 'prisma', { value: mockPrisma, configurable: true });
    Object.defineProperty(authServer, 'createClient', { value: mockAuth.createClient, configurable: true });

    const result = await togglePackLast('item-1', true, 'trip-1');

    expect(result.success).toBe(true);
    expect(updateData.packLast).toBe(true);
  });

  test('addCustomItem should create a custom item if category belongs to user', async () => {
    let createData: any = null;

    const mockPrisma = {
      category: {
        findFirst: async () => ({ id: 'cat-1' }) // Category exists
      },
      packingItem: {
        create: async (args: any) => {
          createData = args.data;
          return { id: 'new-item-1', ...args.data };
        }
      }
    };

    const mockAuth = {
      createClient: async () => ({
        auth: {
          getUser: async () => ({ data: { user: { id: 'user-1' } } })
        }
      })
    };

    const prismaModule = require('../lib/prisma');
    const authServer = require('../lib/supabase/server');
    const { addCustomItem } = require('../actions/packing.actions');

    Object.defineProperty(prismaModule, 'prisma', { value: mockPrisma, configurable: true });
    Object.defineProperty(authServer, 'createClient', { value: mockAuth.createClient, configurable: true });

    const result = await addCustomItem('cat-1', 'Sunglasses', 1, 'trip-1');

    expect(result.error).toBeUndefined();
    expect(result.item?.id).toBe('new-item-1');
    expect(createData.name).toBe('Sunglasses');
    expect(createData.quantity).toBe(1);
    expect(createData.isCustom).toBe(true);
  });

  test('deleteItem should delete a packing item', async () => {
    let deletedId: string | null = null;

    const mockPrisma = {
      packingItem: {
        delete: async (args: any) => {
          deletedId = args.where.id;
          return { id: args.where.id };
        }
      }
    };

    const prismaModule = require('../lib/prisma');
    const { deleteItem } = require('../actions/packing.actions');

    Object.defineProperty(prismaModule, 'prisma', { value: mockPrisma, configurable: true });

    const result = await deleteItem('item-to-delete', 'trip-1');

    expect(result.success).toBe(true);
    expect(deletedId).toBe('item-to-delete');
  });
});
