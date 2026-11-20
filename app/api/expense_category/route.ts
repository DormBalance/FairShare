import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeHousehold } from "@/lib/auth_helpers";

export async function GET(request: NextRequest) {
    const householdId = request.nextUrl.searchParams.get("household_id");
    const categoryId = request.nextUrl.searchParams.get("expense_category_id");
    if (!householdId || !/^\d+$/.test(householdId) || (categoryId && !/^\d+$/.test(categoryId))) {
        return NextResponse.json({ error: "Invalid household or category ID" }, { status: 400 });
    }

    try {
        const household_id = BigInt(householdId);
        const access = await authorizeHousehold(request, household_id);
        if (access instanceof NextResponse) return access;

        if (categoryId) {
            const category = await prisma.expense_categories.findFirst({
                where: { household_id, id: BigInt(categoryId) },
                select: { name: true },
            });
            if (!category) return NextResponse.json({ error: "Expense category not found" }, { status: 404 });
            return NextResponse.json({ success: true, category_name: category.name });
        }

        const categories = await prisma.expense_categories.findMany({
            where: { household_id },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        });
        return NextResponse.json({
            success: true,
            categories: categories.map(({ id, name }) => ({ category_id: id.toString(), category_name: name })),
        });
    } catch {
        return NextResponse.json({ error: "Failed to fetch expense categories" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);
    const householdId = body?.household_id;
    const name = typeof body?.category_name === "string" ? body.category_name.trim() : "";
    if (!householdId || !/^\d+$/.test(String(householdId)) || !name) {
        return NextResponse.json({ error: "Provide a valid household ID and category name" }, { status: 400 });
    }

    try {
        const household_id = BigInt(householdId);
        const access = await authorizeHousehold(request, household_id, true);
        if (access instanceof NextResponse) return access;

        const existing = await prisma.expense_categories.findFirst({ where: { household_id, name } });
        if (existing) return NextResponse.json({ error: "Expense category already exists" }, { status: 409 });

        const category = await prisma.expense_categories.create({ data: { household_id, name } });
        return NextResponse.json({
            status: 201,
            category_id: category.id.toString(),
            category_name: category.name,
        }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Failed to create expense category" }, { status: 500 });
    }
}
