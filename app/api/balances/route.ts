import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import JSONifyBigInt from "../../../utilities/BigInt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET(request: NextRequest) {

    const household_id = request.nextUrl.searchParams.get('household_id');

    if (!household_id) {
        return NextResponse.json({ error: 'household_id is required' }, { status: 400 });
    }

    let householdID: bigint;
    try {
        householdID = BigInt(household_id);
    } catch {
        return NextResponse.json({ error: 'not a valid household_id' }, { status: 400 });
    }

    try {
        const expenses = await prisma.expenses.findMany({
            where : { household_id: householdID },
            select : {
                payer_user_id: true,
                amount: true,
                splits: {
                    select: {
                        user_id: true,
                        amount_to_pay: true,
                        opted_out: true,
                    }
                }
            }
        });

        const settlements = await prisma.settlements.findMany({
            where: { household_id: householdID },
            select: {
                payer_user_id: true,
                recipient_user_id: true,
                amount: true,
            }
        });

        const balanceMap = new Map<string, number>();

        function addBalance(fromUserId: bigint, toUserId: bigint, cents: number) {
            if (fromUserId === toUserId) return;

            const key = `${fromUserId}->${toUserId}`;
            const current = balanceMap.get(key) ?? 0;
            balanceMap.set(key, current + cents);
        }

        for (const expense of expenses) {
            if (!expense.payer_user_id) continue;

            for (const split of expense.splits) {
                if (split.opted_out) continue;
                if (split.user_id === expense.payer_user_id) continue;

                const cents = Math.round(Number(split.amount_to_pay) * 100);
                addBalance(split.user_id, expense.payer_user_id, cents);
            }
        }

        for (const settlement of settlements) {
            const cents = Math.round(Number(settlement.amount) * 100);
            addBalance(settlement.recipient_user_id, settlement.payer_user_id, cents);
        }

        const processedBalances = new Set<string>();
        const pairwise: { from: string, to: string, amount: string }[] = [];

        for (const [key, amount] of balanceMap) {
            const [fromStr, toStr] = key.split('->');
            
            const pairKey = [fromStr, toStr].sort().join('-');
            
            if (processedBalances.has(pairKey)) {
                continue;
            } else {
                processedBalances.add(pairKey);
            }

            const forwardCents = balanceMap.get(`${fromStr}->${toStr}`) ?? 0;
            const reverseCents = balanceMap.get(`${toStr}->${fromStr}`) ?? 0;

            const net = forwardCents - reverseCents;

            if (net > 0) {
                pairwise.push({ from: fromStr, to: toStr, amount: (net / 100).toFixed(2) });
            } else if (net < 0) {
                pairwise.push({ from: toStr, to: fromStr, amount: (Math.abs(net) / 100).toFixed(2) });
            }
        }

    return NextResponse.json(
        { success: true, balances: JSONifyBigInt(pairwise) },
        { status: 200 }
    );

    } catch (err) {
        console.error(`Error getting balances for household ${household_id}: `, err);
        return NextResponse.json(
            { error: 'We encountered an error while getting balances' }, 
            { status: 500 }
        );
    }
}