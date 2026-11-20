// Admin-only endpoints for managing household members.
// PATCH changes a member's role; DELETE removes them with a last-admin guard.
// Pattern referenced from Next.js docs (dynamic route segments) and Prisma docs (update, delete, count).
// AI was used to speed up translating those docs into this boilerplate.

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
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

  if (body?.role !== 'Admin' && body.role !== 'Member') {
    return NextResponse.json({ error: "role must be 'Admin' or 'Member'" }, { status: 400 })
  }

  try {
    const householdId = BigInt(id)
    const memberId = BigInt(userId)
    return await prisma.$transaction(async (tx) => {
      const membership = await tx.household_members.findFirst({
        where: { household_id: householdId, user_id: memberId },
      })
      if (!membership) return NextResponse.json({ error: 'User is not a member' }, { status: 404 })

      if (membership.role === 'Admin' && body.role === 'Member') {
        const admins = await tx.household_members.count({ where: { household_id: householdId, role: 'Admin' } })
        if (admins <= 1) return NextResponse.json({ error: 'Cannot demote the last admin' }, { status: 400 })
      }

      const updated = await tx.household_members.update({
        where: { id: membership.id },
        data: { role: body.role === 'Admin' ? 'Admin' : 'Member' },
      })
      return NextResponse.json(JSONifyBigInt(updated), { status: 200 })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
      return NextResponse.json({ error: 'Membership changed. Please try again.' }, { status: 409 })
    }
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
    const householdId = BigInt(id)
    const memberId = BigInt(userId)
    return await prisma.$transaction(async (tx) => {
      const membership = await tx.household_members.findFirst({
        where: { household_id: householdId, user_id: memberId },
      })
      if (!membership) return NextResponse.json({ error: 'User is not a member' }, { status: 404 })

      if (membership.role === 'Admin') {
        const admins = await tx.household_members.count({ where: { household_id: householdId, role: 'Admin' } })
        if (admins <= 1) return NextResponse.json({ error: 'Cannot remove the last admin' }, { status: 400 })
      }

      await tx.household_members.delete({ where: { id: membership.id } })
      return NextResponse.json({ success: true }, { status: 200 })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
      return NextResponse.json({ error: 'Membership changed. Please try again.' }, { status: 409 })
    }
    console.error('Error removing member:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
