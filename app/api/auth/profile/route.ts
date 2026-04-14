// Profile bootstrap endpoint — creates or updates the user's row in the users table.
// Pattern referenced from Supabase Auth docs (auth.getUser) and Prisma docs (upsert).
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

  let body: { first_name: string; last_name: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.first_name?.trim() || !body.last_name?.trim()) {
    return NextResponse.json({ error: 'first_name and last_name are required' }, { status: 400 })
  }

  try {
    const profile = await prisma.users.upsert({
      where:  { email: user.email! },
      update: { first_name: body.first_name.trim(), last_name: body.last_name.trim() },
      create: { email: user.email!, first_name: body.first_name.trim(), last_name: body.last_name.trim() },
    })

    return NextResponse.json(JSONifyBigInt(profile), { status: 200 })
  } catch (err) {
    console.error('Error upserting profile:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
