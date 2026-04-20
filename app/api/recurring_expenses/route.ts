import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, RecurringExpenseFrequency, SplitType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import JSONifyBigInt from '../../../utilities/BigInt';
import { CalculateEqualSplit, CalculatePercentSplit } from '../expenses/split';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface CreateRecurringBillBody {
    household_id: string;
    creator_user_id: string;
    payer_user_id: string;
    expense_name: string;
    description: string;
    amount: string | number;
    frequency: string;
    next_expense_date: string;
    expense_category_id?: string;
    split_type: string;
    included_user_ids?: string[];
    participants?: {
        user_id: string;
        percent: number;
    }[];
}

// Make sure the user submitted a valid date.
function parseDate(dateValue: string | null | undefined): Date {
    if (dateValue == null || String(dateValue).trim() === '') {
        throw new Error('date is required');
    }
    const parsed = new Date(dateValue);
    if (isNaN(parsed.getTime())) {
        throw new Error('invalid date format');
    }

    return parsed;
}

// Make sure the user submitted a valid amount of money.
function parseMoney(amount: string | number): number {
    const amountStr = String(amount).trim();
    const twoDecimalRegex = /^\d+(\.\d{1,2})?$/;

    if (!twoDecimalRegex.test(amountStr)) {
        throw new Error('invalid amount format');
    }

    const parsed = Number(amountStr);
    if (!isFinite(parsed) || parsed <= 0) {
        throw new Error('invalid amount value');
    }

    return parsed;
}

// Make sure the user submitted a valid frequency.
function parseFrequency(freq: string): RecurringExpenseFrequency {
    if (freq === 'Weekly') return RecurringExpenseFrequency.Weekly;
    if (freq === 'Monthly') return RecurringExpenseFrequency.Monthly;
    else throw new Error('invalid frequency value');
}

// Get all the members' IDs of the current household.
async function getHouseholdMemberIds(householdID: bigint): Promise<Set<string>> {
    const members = await prisma.household_members.findMany({
        where: { household_id: householdID },
        select: { user_id: true }
    });
    
    return new Set(members.map((m) => m.user_id.toString()));
}

export async function POST(request: NextRequest) {
    let body: CreateRecurringBillBody;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Request body is not valid JSON' }, { status: 400 });
    }

    const {
        household_id,
        creator_user_id,
        payer_user_id,
        expense_name,
        description,
        amount,
        frequency,
        next_expense_date,
        expense_category_id,
        split_type,
        included_user_ids,
        participants
    } = body;

    if (!household_id) {
        return NextResponse.json({ error: 'household_id is required' }, { status: 400 });
    }
    if (!creator_user_id) {
        return NextResponse.json({ error: 'creator_user_id is required' }, { status: 400 });
    }
    if (!payer_user_id) {
        return NextResponse.json({ error: 'payer_user_id is required' }, { status: 400 });
    }
    if (!expense_name) {
        return NextResponse.json({ error: 'expense_name is required' }, { status: 400 });
    }
    if (!description || !description.trim()) {
        return NextResponse.json({ error: 'description is required' }, { status: 400 });
    }
    if (!amount) {
        return NextResponse.json({ error: 'amount is required' }, { status: 400 });
    }
    if (!frequency) {
        return NextResponse.json({ error: 'frequency is required' }, { status: 400 });
    }
    if (!next_expense_date) {
        return NextResponse.json({ error: 'next_expense_date is required' }, { status: 400 });
    }

    let resolvedSplitType: SplitType;
    if (split_type === 'Equal')
        resolvedSplitType = SplitType.Equal;
    else if (split_type === 'Custom')
        resolvedSplitType = SplitType.Custom;
    else
        return NextResponse.json({ error: "split_type must be either 'Equal' or 'Custom'" }, { status: 400 });

    let householdID: bigint;
    let creatorUserID: bigint;
    let payerUserID: bigint;
    let billAmount: number;
    let billFrequency: RecurringExpenseFrequency;
    let nextExpenseDate: Date;

    try {
        householdID = BigInt(household_id);
        creatorUserID = BigInt(creator_user_id);
        payerUserID = BigInt(payer_user_id);
    } catch {
        return NextResponse.json({ error: 'not a valid household_id, creator_user_id, or payer_user_id' }, { status: 400 });
    }

    try {
        billAmount = parseMoney(amount);
    } catch {
        return NextResponse.json({ error: 'amount must be a positive number with at most 2 decimal places' }, { status: 400 });
    }

    try {
        billFrequency = parseFrequency(frequency);
    } catch {
        return NextResponse.json({ error: 'frequency must be either "Weekly" or "Monthly"' }, { status: 400 });
    }

    try {
        nextExpenseDate = parseDate(next_expense_date);
    } catch {
        return NextResponse.json({ error: 'next_expense_date is not a valid date' }, { status: 400 });
    }

    try {
        let validIDs = await getHouseholdMemberIds(householdID);

        if (!validIDs.has(creatorUserID.toString())) {
            return NextResponse.json({ error: 'creator_user_id must be a member of the household' }, { status: 400 });
        }

        if (!validIDs.has(payerUserID.toString())) {
            return NextResponse.json({ error: 'payer_user_id must be a member of the household' }, { status: 400 });
        }

        if (expense_category_id) {
            const category = await prisma.expense_categories.findFirst({
                where: {
                    household_id: householdID,
                    id: BigInt(expense_category_id)
                }
            });
            if (!category)
                return NextResponse.json({ error: 'expense category not in household' }, { status: 400 });
        }
        let Rows;

        if (resolvedSplitType === SplitType.Equal) {
            let participantsArray; //logic component
            if(!included_user_ids)
                participantsArray = [];
            else
                participantsArray = included_user_ids;

            const participantIDs = participantsArray.map((id) => {
                return BigInt(id);
            });

            if (participantIDs.length === 0) //validation section
                return NextResponse.json({ error: 'no participants for equal split' }, { status: 400 });

            for (let i = 0; i < participantIDs.length; i++) {
                if (!validIDs.has(participantIDs[i].toString()))
                    return NextResponse.json({ error: 'participants not in household' }, { status: 400 });
            }

            Rows = CalculateEqualSplit({
                ExcludedUserIDs: [],
                PayingUserIDs: participantIDs,
                Amount: billAmount,
            });
        } else {
            if (!participants || participants.length === 0) //validation section
                return NextResponse.json({ error: 'no participants for percent split' }, { status: 400 });

            for (let i = 0; i < participants.length; i++) {
                if (!validIDs.has(participants[i].user_id))
                    return NextResponse.json({ error: 'participants not in household' }, { status: 400 });
            }

            Rows = CalculatePercentSplit({
                ExcludedUserIDs: [],
                Amount: billAmount,
                Participants: participants.map((participant) => ({
                    UserID: BigInt(participant.user_id),
                    Percent: Number(participant.percent)
                })),
            });
        }

        const output = await prisma.$transaction(async function(tx) {
            const recurringExpense = await tx.recurring_expenses.create({
                data: {
                    household_id: householdID,
                    creator_user_id: creatorUserID,
                    payer_user_id: payerUserID,
                    expense_name,
                    description,
                    amount: billAmount,
                    frequency: billFrequency,
                    next_expense_date: nextExpenseDate,
                    expense_category_id: expense_category_id ? BigInt(expense_category_id) : null,
                    split_type: resolvedSplitType
                },
                include: {
                    recurring_expense_creator: {
                        select: { id: true, first_name: true, last_name: true }
                    },
                    recurring_expense_payer: {
                        select: { id: true, first_name: true, last_name: true }
                    }
                }
            });

            const splitData = [];
            for(let i = 0; i < Rows.length; i++){
                splitData.push({
                user_id: Rows[i].UserID,
                opted_out: Rows[i].OptStatus,
                amount_to_pay: Rows[i].Amount,
                recurring_expense_id: recurringExpense.id,
            });

            await tx.expense_splits.createMany({
                data: splitData
            });
            return recurringExpense;
        });

        return NextResponse.json(
        { success: true, recurring_expense: JSONifyBigInt(output) },
        { status: 201 }
        );
    } catch (err) {
        console.error(`Error creating recurring expense: ${description}: `, err);
        return NextResponse.json({ error: 'An unexpected error occurred while creating the recurring expense' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const household_id = searchParams.get('household_id');
    const payer_user_id = searchParams.get('payer_user_id');
    const frequency = searchParams.get('frequency');
    const isActive = searchParams.get('is_active');

    if (!household_id) {
        return NextResponse.json({ error: 'household_id is required' }, { status: 400 });
    }
    
    let householdID: bigint;
    try {
        householdID = BigInt(household_id);
    } catch {
        return NextResponse.json({ error: 'not a valid household_id' }, { status: 400 });
    }

    let payerUserId: bigint | null = null;
    if (payer_user_id) {
        try {
            payerUserId = BigInt(payer_user_id);
        } catch {
            return NextResponse.json({ error: 'not a valid payer_user_id' }, { status: 400 });
        }
    }

    let frequencyFilter: RecurringExpenseFrequency | null = null;
    if (frequency) {
        try {
            frequencyFilter = parseFrequency(frequency);
        } catch {
            return NextResponse.json({ error: 'frequency must be either "Weekly" or "Monthly"' }, { status: 400 });
        }
    }

    let isActiveFilter: boolean | null = null;
    if (isActive) {
        if (isActive === 'true') {
            isActiveFilter = true;
        } else if (isActive === 'false') {
            isActiveFilter = false;
        } else {
            return NextResponse.json({ error: 'is_active must be either "true" or "false"' }, { status: 400 });
        }
    }

    try {
        let queryFilter: any = {
            household_id: householdID,
        };

        if (payer_user_id != null) {
            queryFilter.payer_user_id = payerUserId;
        }

        if (frequency != null) {
            queryFilter.frequency = frequencyFilter;
        }

        if (isActiveFilter != null) {
            queryFilter.is_active = isActiveFilter;
        }

        const outcome = await prisma.recurring_expenses.findMany({
            where: queryFilter,
            include: {
                recurring_expense_creator: { 
                    select: { 
                        id: true, 
                        first_name: true,
                        last_name: true
                    },
                },
                recurring_expense_payer: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true
                    },
                },
                splits: {
                    select: {
                        id: true,
                        user_id: true,
                        amount_to_pay: true,
                        opted_out: true,
                    },
                },
            },
            orderBy: {
                next_expense_date: 'asc'
            }
        });
        return NextResponse.json( 
            {success: true, recurring_expenses: JSONifyBigInt(outcome)},
            { status: 200 }
        );
    }
    catch (err) {
        console.error(`Error fetching recurring expenses in household ${household_id}: `, err);
        return NextResponse.json({ error: 'An unexpected error occurred while fetching recurring expenses' }, { status: 500 });
    }
}