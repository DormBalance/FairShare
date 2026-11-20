import { NextRequest, NextResponse } from "next/server";
import { RecurringExpenseFrequency } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CalculateEqualSplit } from "../../expenses/split";

function nextOccurrence(date: Date, frequency: RecurringExpenseFrequency) {
    const next = new Date(date);
    if (frequency === "Weekly") {
        next.setUTCDate(next.getUTCDate() + 7);
    } else {
        const day = next.getUTCDate();
        next.setUTCDate(1);
        next.setUTCMonth(next.getUTCMonth() + 1);
        const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
        next.setUTCDate(Math.min(day, lastDay));
    }
    return next;
}

export async function POST(request: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get("Authorization") !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const due = await prisma.recurring_expenses.findMany({
            where: { is_active: true, next_expense_date: { lte: new Date() } },
            include: {
                splits: { select: { user_id: true, opted_out: true, amount_to_pay: true } },
                household: { include: { members: { select: { user_id: true } } } },
            },
        });

        const details = [];
        for (const bill of due) {
            const expense = await prisma.$transaction(async (tx) => {
                // Advance the exact occurrence atomically so concurrent runs cannot post it twice.
                const claimed = await tx.recurring_expenses.updateMany({
                    where: { id: bill.id, is_active: true, next_expense_date: bill.next_expense_date },
                    data: { next_expense_date: nextOccurrence(bill.next_expense_date, bill.frequency) },
                });
                if (!claimed.count) return null;

                // Older templates may already have an expense for their first due date.
                const existing = await tx.expenses.findFirst({
                    where: { recurring_expense_id: bill.id, expense_date: bill.next_expense_date },
                    select: { id: true },
                });
                if (existing) return null;

                const splits = bill.splits.length ? bill.splits : CalculateEqualSplit({
                    PayingUserIDs: bill.household.members.map((member) => member.user_id),
                    ExcludedUserIDs: [],
                    Amount: Number(bill.amount),
                }).map((split) => ({
                    user_id: split.UserID, opted_out: split.OptStatus, amount_to_pay: split.Amount,
                }));

                return tx.expenses.create({
                    data: {
                        description: bill.description,
                        expense_name: bill.expense_name,
                        expense_category_id: bill.expense_category_id,
                        recurring_expense_id: bill.id,
                        household_id: bill.household_id,
                        split_type: bill.split_type,
                        amount: bill.amount,
                        expense_date: bill.next_expense_date,
                        creator_user_id: bill.creator_user_id,
                        payer_user_id: bill.payer_user_id,
                        splits: { createMany: { data: splits } },
                    },
                    select: { id: true },
                });
            });

            details.push(expense ? {
                recurring_expense_id: bill.id.toString(), expense_id: expense.id.toString(), status: "created",
            } : { recurring_expense_id: bill.id.toString(), status: "skipped" });
        }

        const created = details.filter((entry) => entry.status === "created").length;
        return NextResponse.json({
            success: true,
            summary: { due_count: due.length, created_count: created, skipped_count: due.length - created, details },
        });
    } catch (error) {
        console.error("Error processing recurring bills:", error);
        return NextResponse.json({ error: "Could not process due recurring bills" }, { status: 500 });
    }
}
