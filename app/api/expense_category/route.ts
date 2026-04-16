import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Route: GET /api/expense_category?household_id=<household_id>&expense_category_id=<expense_category_id>
// Returns the expense category name for the given household
export async function GET(request: NextRequest) {
  let householdId = request.nextUrl.searchParams.get('household_id');
  let expenseCategoryId = request.nextUrl.searchParams.get('expense_category_id');

  if (!householdId || !expenseCategoryId)
    return NextResponse.json({ error: "household_id and expense_category_id must be provided" }, { status: 400 });

  let curCategory = await prisma.expense_categories.findFirst({
    where: {
      id: BigInt(expenseCategoryId),
      household_id: BigInt(householdId)
    },
    select: { id: true, name: true }
  });

  if (!curCategory)
    return NextResponse.json({ error: "Expense category not found" }, { status: 404 });

  return NextResponse.json({ success: true, category_name: curCategory.name });
}

// Route: POST /api/expense_category
// Body: { household_id: string, category_name: string }
// Creates a new expense category for the given household
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let householdId = body.household_id;
    let categoryName = body.category_name;

    if (!householdId || !categoryName)
      return NextResponse.json({ error: "household_id and category_name must be provided" }, { status: 400 });

    // Check if already exists
    let existing = await prisma.expense_categories.findFirst({
      where: {
        household_id: BigInt(householdId),
        name: categoryName
      }
    });

    if (existing)
      return NextResponse.json({ error: "Expense category already exists" }, { status: 204 });

    let createdCategory = await prisma.expense_categories.create({
      data: {
        household_id: BigInt(householdId),
        name: categoryName
      }
    });

    return NextResponse.json({
      status: 201,
      category_id: createdCategory.id.toString(),
      category_name: createdCategory.name
    }, { status: 201 });
  }
  catch (err) {
    console.error('Error creating expense category:', err);
    return NextResponse.json({ error: "Failed to create expense category" }, { status: 500 });
  }
}