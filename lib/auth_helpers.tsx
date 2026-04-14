// Shared auth/role helpers used across all API routes.
// requireUser validates the Bearer token; requireMember/requireAdmin check household membership and role.
// Pattern referenced from Supabase Auth docs (getUser with JWT) and Next.js docs (API route protection).
// AI was used to speed up translating those docs into this boilerplate.

import { type User } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { supabase } from './supabaseClient'
import { prisma } from './prisma'

export async function requireUser(request: NextRequest): Promise<User> {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) throw new Error('Unauthorized')
  const token = auth.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('Unauthorized')
  return user
}

export async function requireMember(householdId: bigint, user: User) {
  const dbUser = await prisma.users.findFirst({ where: { email: user.email } })
  if (!dbUser) throw new Error('User profile not found')

  const member = await prisma.household_members.findFirst({
    where: { household_id: householdId, user_id: dbUser.id },
  })
  if (!member) throw new Error('Forbidden')

  return { dbUser, member }
}

export async function requireAdmin(householdId: bigint, user: User) {
  const { dbUser, member } = await requireMember(householdId, user)
  if (member.role !== 'Admin') throw new Error('Forbidden')
  return { dbUser, member }
}
