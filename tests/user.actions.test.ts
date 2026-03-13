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

test.describe('User Actions', () => {

  test('getUserSettings should fetch settings for an authenticated user', async () => {
    const mockPrisma = {
      user: {
        findUnique: async () => ({
          homeCity: 'London',
          homeCountry: 'UK'
        })
      }
    };

    const mockAuth = {
      createClient: async () => ({
        auth: {
          getUser: async () => ({ data: { user: { id: 'supabase-user-1' } } }),
          getSession: async () => ({ data: { session: null } })
        }
      })
    };

    const prismaModule = require('../lib/prisma');
    const authServer = require('../lib/supabase/server');
    const { getUserSettings } = require('../actions/user.actions');

    Object.defineProperty(prismaModule, 'prisma', { value: mockPrisma, configurable: true });
    Object.defineProperty(authServer, 'createClient', { value: mockAuth.createClient, configurable: true });

    const result = await getUserSettings();

    expect(result.error).toBeUndefined();
    expect(result.settings?.homeCity).toBe('London');
    expect(result.settings?.homeCountry).toBe('UK');
  });

  test('getUserSettings should return error if unauthenticated', async () => {
    const mockAuth = {
      createClient: async () => ({
        auth: {
          getUser: async () => ({ data: { user: null } }),
          getSession: async () => ({ data: { session: null } })
        }
      })
    };

    const authServer = require('../lib/supabase/server');
    const { getUserSettings } = require('../actions/user.actions');

    Object.defineProperty(authServer, 'createClient', { value: mockAuth.createClient, configurable: true });

    const result = await getUserSettings();

    expect(result.settings).toBeUndefined();
    expect(result.error).toBe('Unauthorized');
  });

  test('updateUserSettings should update settings and revalidate paths', async () => {
    let updateCalled = false;
    let updateData: any = null;

    const mockPrisma = {
      user: {
        update: async (args: any) => {
          updateCalled = true;
          updateData = args.data;
          return { id: 'user-1', ...args.data };
        }
      }
    };

    const mockAuth = {
      createClient: async () => ({
        auth: {
          getUser: async () => ({ data: { user: { id: 'supabase-user-1' } } }),
          getSession: async () => ({ data: { session: null } })
        }
      })
    };

    const prismaModule = require('../lib/prisma');
    const authServer = require('../lib/supabase/server');
    const { updateUserSettings } = require('../actions/user.actions');

    Object.defineProperty(prismaModule, 'prisma', { value: mockPrisma, configurable: true });
    Object.defineProperty(authServer, 'createClient', { value: mockAuth.createClient, configurable: true });

    const newSettings = {
      homeCity: 'Paris',
      homeCountry: 'FR'
    };

    const result = await updateUserSettings(newSettings);

    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);
    expect(updateCalled).toBe(true);
    expect(updateData.homeCity).toBe('Paris');
    expect(updateData.homeCountry).toBe('FR');
  });
});
