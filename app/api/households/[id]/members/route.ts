// https://stackoverflow.com/questions/75223154/how-to-list-members-of-a-group-with-role-based-access-in-nextjs-app-router

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { requireUser, requireMember } from '../../../../../lib/auth_helpers'
import JSONifyBigInt from '../../../../../utilities/BigInt'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let user
  try {
    user = await requireUser(request)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await requireMember(BigInt(id), user)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const members = await prisma.household_members.findMany({
      where:   { household_id: BigInt(id) },
      include: {
        user: { select: { id: true, first_name: true, last_name: true, email: true } },
      },
    })

    const result = members.map((m) => ({
      id:          m.user.id,
      first_name:  m.user.first_name,
      last_name:   m.user.last_name,
      email:       m.user.email,
      role:        m.role,
      time_joined: m.time_joined,
    }))

    return NextResponse.json(JSONifyBigInt(result), { status: 200 })
  } catch (err) {
    console.error('Error listing members:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
