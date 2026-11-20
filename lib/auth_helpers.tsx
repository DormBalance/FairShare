// Shared auth/role helpers used across all API routes.
// requireUser validates the Bearer token; requireMember/requireAdmin check household membership and role.
// Pattern referenced from Supabase Auth docs (getUser with JWT) and Next.js docs (API route protection).
// AI was used to speed up translating those docs into this boilerplate.

import { type User } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { prisma } from './prisma'

export async function requireUser(request: NextRequest): Promise<User> {
  const auth = request.headers.get('Authorization')
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } },
  )
  if (auth && !auth.startsWith('Bearer ')) throw new Error('Unauthorized')
  const { data: { user }, error } = await client.auth.getUser(auth?.slice(7))
  if (error || !user?.email) throw new Error('Unauthorized')
  return user
}

export async function authorizeHousehold(request: NextRequest, householdId: bigint, adminOnly = false) {
  let user: User
  try {
    user = await requireUser(request)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const member = await prisma.household_members.findFirst({
    where: { household_id: householdId, user: { email: user.email! } },
    select: { user_id: true, role: true },
  })

  if (!member || (adminOnly && member.role !== 'Admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return member
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
