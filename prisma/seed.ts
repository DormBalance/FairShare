//THIS FILE IS SOLEY FOR SEEDING THE DATABASE WITH TEST DATA. IT SHOULD NOT BE USED IN PRODUCTION. 
//FEEL FREE TO RUN THIS FILE AND MODIFY VALUES AS NEEDED TO TEST OUT THE APP.
//TO RUN THIS FILE, USE THE COMMAND: npx prisma db seed

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, HouseholdRole, SplitType } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  
  await prisma.expense_splits.deleteMany();
  await prisma.settlements.deleteMany();
  await prisma.expenses.deleteMany();
  await prisma.household_members.deleteMany();
  await prisma.expense_categories.deleteMany();
  await prisma.recurring_expenses.deleteMany();
  await prisma.users.deleteMany();
  await prisma.households.deleteMany();

  
  const household = await prisma.households.create({
    data: {
      name: "Test Household",
      invite_code: "TEST123",
      description: "Seed household for development"
    }
  });

  
  const user1 = await prisma.users.create({
    data: {
      first_name: "Guillermo",
      last_name: "Novillo",
      email: "guillermo@test.com"
    }
  });

  const user2 = await prisma.users.create({
    data: {
      first_name: "Zach",
      last_name: "Smith",
      email: "zach@test.com"
    }
  });

  const user3 = await prisma.users.create({
    data: {
      first_name: "Anthony",
      last_name: "Garcia",
      email: "anthony@test.com"
    }
  });

 
  await prisma.household_members.createMany({
    data: [
      {
        user_id: user1.id,
        household_id: household.id,
        role: HouseholdRole.Admin
      },
      {
        user_id: user2.id,
        household_id: household.id,
        role: HouseholdRole.Member
      },
      {
        user_id: user3.id,
        household_id: household.id,
        role: HouseholdRole.Member
      }
    ]
  });


  const groceriesCategory = await prisma.expense_categories.create({
    data: {
      name: "Groceries",
      household_id: household.id
    }
  });

  const diningCategory = await prisma.expense_categories.create({
    data: {
      name: "Dining",
      household_id: household.id
    }
  });

 
  const groceriesExpense = await prisma.expenses.create({
    data: {
      description: "Weekly groceries from Publix",
      household_id: household.id,
      creator_user_id: user1.id,
      payer_user_id: user1.id,
      amount: "90.00",
      expense_name: "Groceries",
      split_type: SplitType.Equal,
      expense_date: new Date("2026-03-13T12:00:00.000Z"),
      expense_category_id: groceriesCategory.id
    }
  });

  const dinnerExpense = await prisma.expenses.create({
    data: {
      description: "Team dinner",
      household_id: household.id,
      creator_user_id: user2.id,
      payer_user_id: user2.id,
      amount: "60.00",
      expense_name: "Dinner",
      split_type: SplitType.Equal,
      expense_date: new Date("2026-03-13T18:30:00.000Z"),
      expense_category_id: diningCategory.id
    }
  });


  await prisma.expense_splits.createMany({
    data: [
      {
        expense_id: groceriesExpense.id,
        user_id: user1.id,
        amount_to_pay: "30.00",
        opted_out: false
      },
      {
        expense_id: groceriesExpense.id,
        user_id: user2.id,
        amount_to_pay: "30.00",
        opted_out: false
      },
      {
        expense_id: groceriesExpense.id,
        user_id: user3.id,
        amount_to_pay: "30.00",
        opted_out: false
      },
      {
        expense_id: dinnerExpense.id,
        user_id: user1.id,
        amount_to_pay: "20.00",
        opted_out: false
      },
      {
        expense_id: dinnerExpense.id,
        user_id: user2.id,
        amount_to_pay: "20.00",
        opted_out: false
      },
      {
        expense_id: dinnerExpense.id,
        user_id: user3.id,
        amount_to_pay: "20.00",
        opted_out: false
      }
    ]
  });

  
  await prisma.settlements.create({
    data: {
      household_id: household.id,
      payer_user_id: user3.id,
      recipient_user_id: user1.id,
      amount: "30.00",
      payment_method: "Venmo",
      payment_date: new Date("2026-03-14T10:00:00.000Z")
    }
  });

  console.log("Seed data inserted successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
