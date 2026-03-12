'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { UserSettings } from '@/types'

async function getSupabaseUser() {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return user
  } catch {}
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user ?? null
  } catch {}
  return null
}

export async function getUserSettings(): Promise<{ settings?: UserSettings; error?: string }> {
  try {
    const authUser = await getSupabaseUser()
    if (!authUser) return { error: 'Unauthorized' }

    const user = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
      select: { homeCity: true, homeCountry: true },
    })

    if (!user) return { error: 'User not found' }

    return {
      settings: {
        homeCity: user.homeCity,
        homeCountry: user.homeCountry,
      },
    }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch user settings' }
  }
}

export async function updateUserSettings(
  settings: Partial<UserSettings>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const authUser = await getSupabaseUser()
    if (!authUser) return { error: 'Unauthorized' }

    await prisma.user.update({
      where: { supabaseId: authUser.id },
      data: {
        homeCity: settings.homeCity ?? undefined,
        homeCountry: settings.homeCountry ?? undefined,
      },
    })

    revalidatePath('/settings')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to update settings' }
  }
}
