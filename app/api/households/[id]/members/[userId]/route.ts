// https://stackoverflow.com/questions/76001834/how-to-implement-role-change-and-member-removal-in-a-household-app-with-prisma

import { NextRequest, NextResponse } from 'next/server'
import { HouseholdRole } from '@prisma/client'
import { prisma } from '../../../../../../lib/prisma'
import { requireUser, requireAdmin } from '../../../../../../lib/auth_helpers'
import JSONifyBigInt from '../../../../../../utilities/BigInt'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params

  let user
  try {
    user = await requireUser(request)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await requireAdmin(BigInt(id), user)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { role: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.role !== 'Admin' && body.role !== 'Member') {
    return NextResponse.json({ error: "role must be 'Admin' or 'Member'" }, { status: 400 })
  }

  try {
    const membership = await prisma.household_members.findFirst({
      where: { household_id: BigInt(id), user_id: BigInt(userId) },
    })

    if (!membership) return NextResponse.json({ error: 'User is not a member' }, { status: 404 })

    const updated = await prisma.household_members.update({
      where: { id: membership.id },
      data:  { role: body.role as HouseholdRole },
    })

    return NextResponse.json(JSONifyBigInt(updated), { status: 200 })
  } catch (err) {
    console.error('Error changing role:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params

  let user
  try {
    user = await requireUser(request)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await requireAdmin(BigInt(id), user)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const membership = await prisma.household_members.findFirst({
      where: { household_id: BigInt(id), user_id: BigInt(userId) },
    })

    if (!membership) return NextResponse.json({ error: 'User is not a member' }, { status: 404 })

    const adminCount = await prisma.household_members.count({
      where: { household_id: BigInt(id), role: 'Admin' },
    })

    if (adminCount === 1 && membership.role === 'Admin') {
      return NextResponse.json({ error: 'Cannot remove the last admin' }, { status: 400 })
    }

    await prisma.household_members.delete({ where: { id: membership.id } })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('Error removing member:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
