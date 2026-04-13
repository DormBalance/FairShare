import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, SplitType, RecurringExpenseFrequency } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import JSONifyBigInt from '../../../../utilities/BigInt';
import { CalculateEqualSplit } from '../../expenses/split';

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL});
const prisma = new PrismaClient({adapter});

function addFrequency(date: Date, frequency: RecurringExpenseFrequency): Date {
    const newDate = new Date(date);

    if (frequency === RecurringExpenseFrequency.Weekly) {
        newDate.setDate(newDate.getDate() + 7);
    } else {
        newDate.setMonth(newDate.getMonth() + 1);
    }

    return newDate;
}

export async function POST(_request: NextRequest) {
    const now = new Date();

    try {
        const dueRecurringExpenses = await prisma.recurring_expenses.findMany({
            where: {
                is_active: true,
                next_expense_date: { lte: now },
            },
            include: {
                household: {
                    include: {
                        members: { select: { user_id: true } }
                    },
                },
            },
        });

        const due_count = dueRecurringExpenses.length;

        const result = await prisma.$transaction(async (tx) => {
            let created_count = 0;
            let skipped_count = 0;
            const details = [];

            for (const expense of dueRecurringExpenses) {
                const existing = await tx.expenses.findFirst({
                    where: {
                        recurring_expense_id: expense.id,
                        expense_date: expense.next_expense_date,
                    },
                });

                if (existing) {
                    skipped_count++;
                    details.push({ recurring_expense_id: expense.id.toString(), status: 'skipped' });
                    continue;
                }

                const memberIds = expense.household.members.map((m) => m.user_id);
                
                const splitRows = CalculateEqualSplit({
                    PayingUserIDs: memberIds,
                    ExcludedUserIDs: [],
                    Amount: Number(expense.amount),
                });
                
                const createdExpense = await tx.expenses.create({
                    data: {
                        description: expense.description,
                        expense_name: expense.expense_name,
                        expense_category_id: expense.expense_category_id,
                        recurring_expense_id: expense.id,
                        household_id: expense.household_id,
                        split_type: SplitType.Equal,
                        amount: Number(expense.amount),
                        expense_date: expense.next_expense_date,
                        creator_user_id: expense.creator_user_id,
                        payer_user_id: expense.payer_user_id,
                    },
                });

                await tx.expense_splits.createMany({
                    data: splitRows.map((row) => ({
                        user_id: row.UserID,
                        opted_out: row.OptStatus,
                        amount_to_pay: row.Amount,
                        expense_id: createdExpense.id,
                    }))
                });

                const nextDate = addFrequency(expense.next_expense_date, expense.frequency);

                await tx.recurring_expenses.update({
                    where: { id: expense.id },
                    data: { next_expense_date: nextDate },
                });

                created_count++;
                details.push({
                    recurring_expense_id: expense.id.toString(),
                    expense_id: createdExpense.id.toString(),
                    status: 'created',
                });

                return {
                    created_count,
                    skipped_count,
                    details,
                }
            }
        });

    return NextResponse.json(
        { success: true, summary: JSONifyBigInt({ due_count, ...result }) },
        { status: 200 },
    );
    } catch (err) {
        console.error('Error running due recurring expenses:', err);
        return NextResponse.json(
            { error: 'An error occurred while processing due recurring expenses' }, 
            { status: 500 }
        );
    }
}