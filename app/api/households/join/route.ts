// Joins the authenticated user to a household using an invite code.
// Pattern referenced from Next.js docs (App Router API routes) and Prisma docs (findFirst, create).
// AI was used to speed up translating those docs into this boilerplate.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { requireUser } from '../../../../lib/auth_helpers'
import JSONifyBigInt from '../../../../utilities/BigInt'

export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireUser(request)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { invite_code: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.invite_code?.trim()) {
    return NextResponse.json({ error: 'invite_code is required' }, { status: 400 })
  }

  const dbUser = await prisma.users.findFirst({ where: { email: user.email } })
  if (!dbUser) return NextResponse.json({ error: 'User profile not found' }, { status: 404 })

  try {
    const household = await prisma.households.findFirst({
      where: { invite_code: body.invite_code.trim().toUpperCase() },
    })

    if (!household) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })

    const existing = await prisma.household_members.findFirst({
      where: { household_id: household.id, user_id: dbUser.id },
    })

    if (existing) return NextResponse.json({ error: 'Already a member' }, { status: 409 })

    const member = await prisma.household_members.create({
      data: { household_id: household.id, user_id: dbUser.id, role: 'Member' },
    })

    return NextResponse.json(JSONifyBigInt({ household, member }), { status: 201 })
  } catch (err) {
    console.error('Error joining household:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
