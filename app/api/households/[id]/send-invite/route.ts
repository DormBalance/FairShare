// Claude added the invite logic for this route.
// Pattern referenced from Supabase Auth Admin docs (inviteUserByEmail):
// https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail
// and Next.js App Router API route docs:
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '../../../../../lib/prisma'
import { requireUser, requireAdmin } from '../../../../../lib/auth_helpers'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(
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
        await requireAdmin(BigInt(id), user)
    } catch {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: { email: string }
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!body.email) {
        return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    try {
        const household = await prisma.households.findUnique({
            where: { id: BigInt(id) },
            select: { invite_code: true, name: true }
        })

        if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 })

        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

        const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(body.email, {
            redirectTo: `${appUrl}/households?code=${household.invite_code}`
        })

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (err) {
        console.error('Error sending invite:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
