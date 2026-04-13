// https://stackoverflow.com/questions/72813062/create-a-group-with-invite-code-using-prisma-and-nextjs-api-routes

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { requireUser } from '../../../lib/auth_helpers'
import JSONifyBigInt from '../../../utilities/BigInt'

export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireUser(request)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { name?: string; description?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const dbUser = await prisma.users.findFirst({ where: { email: user.email } })
  if (!dbUser) return NextResponse.json({ error: 'User profile not found' }, { status: 404 })

  try {
    const invite_code = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()

    const household = await prisma.$transaction(async (tx) => {
      const h = await tx.households.create({
        data: {
          name:        body.name?.trim() ?? 'Your Household',
          description: body.description?.trim() ?? null,
          invite_code,
        },
      })
      await tx.household_members.create({
        data: { household_id: h.id, user_id: dbUser.id, role: 'Admin' },
      })
      return h
    })

    return NextResponse.json(JSONifyBigInt(household), { status: 201 })
  } catch (err) {
    console.error('Error creating household:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  let user
  try {
    user = await requireUser(request)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.users.findFirst({ where: { email: user.email } })
  if (!dbUser) return NextResponse.json({ error: 'User profile not found' }, { status: 404 })

  try {
    const memberships = await prisma.household_members.findMany({
      where:   { user_id: dbUser.id },
      include: { household: true },
    })

    const households = memberships.map((m) => ({
      ...JSONifyBigInt(m.household),
      role: m.role,
    }))

    return NextResponse.json(households, { status: 200 })
  } catch (err) {
    console.error('Error listing households:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
