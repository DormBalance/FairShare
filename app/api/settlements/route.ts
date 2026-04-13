import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import JSONifyBigInt from '../../../utilities/BigInt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface CreateSettlementBody {
    household_id: string;
    payer_user_id: string;
    recipient_user_id: string;
    amount: string | number;
    payment_method: string;
    payment_date?: string;
}

// Make sure the user submitted a valid date.
function parseDate(dateValue: string | null | undefined): Date | null {
    if (dateValue == null || String(dateValue).trim() === '') return null;

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

// Get all the members' IDs of the current household.
async function getHouseholdMemberIds(householdID: bigint): Promise<Set<string>> {
    const members = await prisma.household_members.findMany({
        where: { household_id: householdID },
        select: { user_id: true }
    });
    
    return new Set(members.map((m) => m.user_id.toString()));
}

export async function POST(request: NextRequest) {
    let body: CreateSettlementBody;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Request body is not valid JSON' }, { status: 400 });
    }
    
    const {
        household_id,
        payer_user_id,
        recipient_user_id,
        amount,
        payment_method,
        payment_date
    } = body;
  
    if (!household_id) {
        return NextResponse.json({ error: 'household_id is required' }, { status: 400 });
    }
    if (!payer_user_id) {
        return NextResponse.json({ error: 'payer_user_id is required' }, { status: 400 });
    }
    if (!recipient_user_id) {
        return NextResponse.json({ error: 'recipient_user_id is required' }, { status: 400 });
    }
    if (amount == null || String(amount).trim() === '') {
        return NextResponse.json({ error: 'amount is required' }, { status: 400 });
    }
    if (!payment_method || !payment_method.trim()) {
        return NextResponse.json({ error: 'payment_method is required' }, { status: 400 });
    }

    let householdID: bigint;
    let payerUserID: bigint;
    let recipientUserID: bigint;
    let paymentAmount: number;
    let paymentDateObj: Date | null;

    try {
        householdID = BigInt(household_id);
        payerUserID = BigInt(payer_user_id);
        recipientUserID = BigInt(recipient_user_id);
    } catch {
      return NextResponse.json({ error: 'not a valid household_id, payer_user_id, or recipient_user_id' }, { status: 400 });
    }

    if (payerUserID === recipientUserID) {
      return NextResponse.json({ error: 'payer_user_id and recipient_user_id cannot be the same' }, { status: 400 });
    }

    try {
        paymentAmount = parseMoney(amount);
    } catch {
      return NextResponse.json({ error: 'amount must be a positive number with at most 2 decimal places' }, { status: 400 });
    }

    try {
        paymentDateObj = parseDate(payment_date);
    } catch {
      return NextResponse.json({ error: 'payment_date is not a valid date' }, { status: 400 });
    }

    try {
        const validMemberIds = await getHouseholdMemberIds(householdID);

        if (!validMemberIds.has(payerUserID.toString())) {
          return NextResponse.json({ error: 'payer_user_id not in household' }, { status: 400 });
        }

        if (!validMemberIds.has(recipientUserID.toString())) {
          return NextResponse.json({ error: 'recipient_user_id not in household' }, { status: 400 });
        }

        const created = await prisma.settlements.create({
            data: {
                household_id: householdID,
                payer_user_id: payerUserID,
                recipient_user_id: recipientUserID,
                amount: paymentAmount,
                payment_method: payment_method.trim(),
                ...(paymentDateObj ? { payment_date: paymentDateObj } : {})
            },
            include: {
                settlement_payer: {
                    select: { id: true, first_name: true, last_name: true }
                },
                settlement_recipient: {
                    select: { id: true, first_name: true, last_name: true }
                }
            }
        });

        return NextResponse.json(
        { success: true, settlement: JSONifyBigInt(created) },
        { status: 201 }
        );
    } catch (err) {
      console.error(`Error creating settlement ${payer_user_id}->${recipient_user_id}: `, err);
      return NextResponse.json({ error: 'We encountered an error while creating the settlement' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const household_id = searchParams.get('household_id');
  const payer_user_id = searchParams.get('payer_user_id');
  const recipient_user_id = searchParams.get('recipient_user_id');
  const start_date = searchParams.get('start_date');
  const end_date = searchParams.get('end_date');

  if (!household_id) {
    return NextResponse.json({ error: 'household_id is required' }, { status: 400 });
  }

  let householdID: bigint;
  try {
    householdID = BigInt(household_id);
  } catch {
    return NextResponse.json({ error: 'not a valid household_id' }, { status: 400 });
  }

  let payerUserID: bigint | null = null;
  if (payer_user_id != null) {
    try {
      payerUserID = BigInt(payer_user_id);
    } catch {
      return NextResponse.json({ error: 'not a valid payer_user_id' }, { status: 400 });
    }
  }

  let recipientUserID: bigint | null = null;
  if (recipient_user_id != null) {
    try {
      recipientUserID = BigInt(recipient_user_id);
    } catch {
      return NextResponse.json({ error: 'not a valid recipient_user_id' }, { status: 400 });
    }
  }

  let startDate: Date | null = null;
  let endDate: Date | null = null;

  try {
    startDate = parseDate(start_date);
    endDate = parseDate(end_date);
  } catch {
    return NextResponse.json({ error: 'not a valid start date or end date' }, { status: 400 });
  }

  try {
    const queryFilter: any = {
      household_id: householdID
    };

    if (payerUserID != null) {
      queryFilter.payer_user_id = payerUserID;
    }

    if (recipientUserID != null) {
      queryFilter.recipient_user_id = recipientUserID;
    }

    if (startDate != null || endDate != null) {
      queryFilter.payment_date = {};
      if (startDate != null) queryFilter.payment_date.gte = startDate;
      if (endDate != null) queryFilter.payment_date.lte = endDate;
    }

    const rows = await prisma.settlements.findMany({
      where: queryFilter,
      include: {
        settlement_payer: {
          select: { id: true, first_name: true, last_name: true }
        },
        settlement_recipient: {
          select: { id: true, first_name: true, last_name: true }
        }
      },
      orderBy: {
        payment_date: 'desc'
      }
    });

    return NextResponse.json(
      { success: true, settlements: JSONifyBigInt(rows) },
      { status: 200 }
    );
  } catch (err) {
    console.error(`Error getting settlement in household ${householdID}: `, err);
    return NextResponse.json({ error: 'We encountered an error while getting settlements' }, { status: 500 });
  }
}