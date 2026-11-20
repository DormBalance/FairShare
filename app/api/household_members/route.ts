import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth_helpers";

export async function GET(request: NextRequest) {
    const requestedId = request.nextUrl.searchParams.get("userId");
    if (!requestedId || !/^\d+$/.test(requestedId)) {
        return NextResponse.json({ error: "Provide a valid user ID" }, { status: 400 });
    }

    let user;
    try {
        user = await requireUser(request);
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = BigInt(requestedId);
        const profile = await prisma.users.findUnique({ where: { email: user.email }, select: { id: true } });
        if (profile?.id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const membership = await prisma.household_members.findFirst({
            where: { user_id: userId },
            orderBy: { household_id: "asc" },
            select: { household_id: true },
        });
        if (!membership) return NextResponse.json({ error: "This user has no household" }, { status: 404 });

        const members = await prisma.household_members.findMany({
            where: { household_id: membership.household_id },
            include: { user: { select: { id: true, first_name: true, last_name: true } } },
        });
        return NextResponse.json(members.map(({ user, role }) => ({ ...user, id: user.id.toString(), role })));
    } catch {
        return NextResponse.json({ error: "Failed to load household members" }, { status: 500 });
    }
}
