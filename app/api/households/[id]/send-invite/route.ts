// ChatGPT wrote the email linking with Resend as Supabase didn't share the invite code correctly like we expected.
// Pattern referenced from Resend docs: https://resend.com/docs/send-with-nextjs

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '../../../../../lib/prisma'
import { requireUser, requireAdmin } from '../../../../../lib/auth_helpers'

const resend = new Resend(process.env.RESEBD_API_KEY)

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

        const { error } = await resend.emails.send({
            from: 'FairShare <noreply@fairshare-expenses.com>',
            to: body.email,
            subject: 'You have been invited to FairShare',
            html: `
                <h2>You have been invited</h2>
                <p>You have been invited to join a household on FairShare. Follow this link to accept the invite:</p>
                <p>Your invite code is: <strong>${household.invite_code}</strong></p>
                <p><a href="https://fairshare-expenses.com">Create an account</a></p>
            `
        })

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (err) {
        console.error('Error sending invite:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
