// POST creates a new household and adds the creator as Admin in a single transaction.
// GET returns all households the authenticated user belongs to.
// Pattern referenced from Next.js docs (App Router API routes) and Prisma docs (transactions, relations).
// AI was used to speed up translating those docs into this boilerplate.

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
    // crypto.randomUUID docs: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
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
      await tx.expense_categories.createMany({
        data: [
          { household_id: h.id, name: 'Groceries' },
          { household_id: h.id, name: 'Rent' },
          { household_id: h.id, name: 'Dining' },
          { household_id: h.id, name: 'Utilities' },
          { household_id: h.id, name: 'Entertainment' },
          { household_id: h.id, name: 'Transportation' },
          { household_id: h.id, name: 'Miscellaneous' }
        ],
      })
      return h
    })

    const categories = ["Groceries", "Rent", "Dining", "Utilities", "Entertainment", "Transportation", "Miscellaneous"];
    for (const category_name of categories) {
      await fetch(`${request.nextUrl.origin}/api/expense_category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household_id: household.id.toString(), category_name }),
      })
    }


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
