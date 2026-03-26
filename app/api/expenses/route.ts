import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, SplitType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { CalculateEqualSplit, CalculatePercentSplit } from './split';

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL});
const prisma = new PrismaClient({adapter});

// Helper to parse BigInt types into string for JSON response
function JSONifyBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, val) => 
      typeof val === 'bigint' ? val.toString() : val)
  );
}

interface CreateExpenseBody {
  expense_name: string;
  description?: string;
  household_id: string;
  creator_user_id: string;
  payer_user_id?: string;
  amount: string | number;
  split_type: string;
  expense_date: string;
  recurring_expense_id?: string;
  expense_category_id?: string;
  excluded_user_ids?: string[];
  included_user_ids?: string[];
  participants?: {
    user_id: string;
    percent: number;
  }[];
}

export async function POST(request: NextRequest) {
  let body: CreateExpenseBody;

  try {
    body = await request.json();
  }
  catch {
    return NextResponse.json({error: "Request body is not valid JSON"}, {status: 400});
  }

  let {
    expense_name, description,
    household_id, creator_user_id,
    payer_user_id, amount,
    split_type, expense_date: expense_date,
    recurring_expense_id, expense_category_id, excluded_user_ids, 
    included_user_ids, participants
  } = body;

  //  Validate Inputs
  if (!creator_user_id)
    return NextResponse.json({error: "creator_user_id is required"}, {status: 400});

  if (!payer_user_id)
    return NextResponse.json({error: "payer_user_id is required"}, {status: 400});

  if (!expense_name?.trim())
    return NextResponse.json({error: "expense_name is required"}, {status: 400});

  if (!household_id)
    return NextResponse.json({error: "household_id is required"}, {status: 400});  

  if (!expense_date)
    return NextResponse.json({error: "expense_date is required"}, {status: 400});

  const amountStr = String(amount).trim();
  const twoDecimalRegex = /^\d+(\.\d{1,2})?$/; // Check for positive number with up to 2 decimal places

  if (!twoDecimalRegex.test(amountStr))
    return NextResponse.json({error: "amount must be a positive number with at most 2 decimal places"}, {status: 400});


  let resolvedSplitType: SplitType;
  if (split_type === 'Equal')
    resolvedSplitType = SplitType.Equal;
  else if (split_type === 'Custom')
    resolvedSplitType = SplitType.Custom;
  else
    return NextResponse.json({error: "split_type must be either 'Equal' or 'Custom'"}, {status: 400});

  const expenseDateObj = new Date(expense_date);
  if (isNaN(expenseDateObj.getTime()))
    return NextResponse.json({error: "expense_date is not a valid date"}, {status: 400});

  const paymentAmount = parseFloat(amountStr);
  if (isNaN(paymentAmount) || paymentAmount <= 0)
    return NextResponse.json({error: "amount must be a positive number"}, {status: 400});

  try {
    const creatorUserID = BigInt(creator_user_id);
    const payerUserID = BigInt(payer_user_id);
    const householdID = BigInt(household_id);

    let excludedUserArray;
    if(excluded_user_ids == null){
      excludedUserArray = [];
    } 
    else{
      excludedUserArray = excluded_user_ids;
    }
    const excludedUserIDs = excludedUserArray.map((id) =>{
      return BigInt(id);
    });

    const householdMembers = await prisma.household_members.findMany({
      where: {household_id: householdID},
      select: {user_id: true}
    });

    const validIDs = new Set(householdMembers.map(member => member.user_id.toString()));

    if(!validIDs.has(creatorUserID.toString())){
      return NextResponse.json({error: "creators id not in household"}, {status: 400});
    }

    if(!validIDs.has(payerUserID.toString())){
      return NextResponse.json({error: "payer id not in household"}, {status: 400});
    }

    if(expense_category_id != null){
      const categoryID = await prisma.expense_categories.findFirst({
        where: {
          household_id: householdID,
          id: BigInt(expense_category_id)
        }
      });

      if(categoryID == null){
        return NextResponse.json({error: "expense category not in household"}, {status: 400});
      }}
    let Rows;

    if(resolvedSplitType === SplitType.Equal){ //equal split logic and validation
      let participantsArray; //logic component
      if(!included_user_ids){
        participantsArray = [];
      } else{
        participantsArray = included_user_ids;
      }

      const participantIDs = participantsArray.map((id) => {
        return BigInt(id);
      });

      if(participantIDs.length === 0){ //validation section
        return NextResponse.json({error: "no participants for equal split"}, {status: 400});
      }

      for(let i = 0; i < excludedUserIDs.length; i++){
        if(!validIDs.has(excludedUserIDs[i].toString())){
          return NextResponse.json({error: "excluded users not in household"}, {status: 400});
        }
      }

      for(let i = 0; i < participantIDs.length; i++){
        if(!validIDs.has(participantIDs[i].toString())){
          return NextResponse.json({error: "participants not in household"}, {status: 400});
        }
      }

      Rows = CalculateEqualSplit({ //main logic equal split component
        ExcludedUserIDs: excludedUserIDs,
        PayingUserIDs: participantIDs,
        Amount: paymentAmount,
      });
    }

    else{ //percent split (just copy pasted equal split while calling percent)
         if(!participants ||participants.length === 0){ //validation section
        return NextResponse.json({error: "no participants for percent split"}, {status: 400})
      }

      for(let i = 0; i < excludedUserIDs.length; i++){
        if(!validIDs.has(excludedUserIDs[i].toString())){
          return NextResponse.json({error: "excluded users not in household"}, {status: 400});
        }
      }

      for(let i = 0; i < participants.length; i++){
        if(!validIDs.has(participants[i].user_id)){
          return NextResponse.json({error: "participants not in household"}, {status: 400});
        }
      }

      Rows = CalculatePercentSplit({ //main logic component percent split
        ExcludedUserIDs: excludedUserIDs,
        Amount: paymentAmount,
        Participants: participants.map((participant) => ({
          UserID: BigInt(participant.user_id),
          Percent: Number(participant.percent)
        })),
      });
    }

    //run all database updates during transaction

    const output = await prisma.$transaction(async function(tx){


      let trimDescription = "";
      if(description){
        trimDescription = description.trim();
      }

      let expenseCategoryID = null;

      if(expense_category_id != null){
        expenseCategoryID = BigInt(expense_category_id);
      }

      let reccuringExpenseID = null;

      if(recurring_expense_id != null){
        reccuringExpenseID = BigInt(recurring_expense_id);
      }


      const expense = await tx.expenses.create({
        data: {
          description: trimDescription,
          expense_name: expense_name.trim(),
          expense_category_id: expenseCategoryID,
          recurring_expense_id: reccuringExpenseID,
          household_id: householdID,
          split_type: resolvedSplitType,
          amount: paymentAmount,
          expense_date: expenseDateObj,
          creator_user_id: creatorUserID,
          payer_user_id: payerUserID,
        },
      });

      const splitData = [];
      for(let i = 0; i < Rows.length; i++){
        splitData.push({
          user_id: Rows[i].UserID,
          opted_out: Rows[i].OptStatus,
          amount_to_pay: Rows[i].Amount,
          expense_id: expense.id,
        });
    }

    await tx.expense_splits.createMany({
      data: splitData,
    });
    return expense;
     
    });

    return NextResponse.json(
      {success: true, expense: JSONifyBigInt(output)},
      {status: 201}

  );

  }

    
    catch (err) {
    console.error(`Error creating expense ${expense_name}: `, err);
    return NextResponse.json({error: "We encountered an error while creating the expense"}, {status: 500});
  }
}


  
