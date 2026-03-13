import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

//THIS FILE IS SOLEY FOR SEEDING THE DATABASE WITH TEST DATA. IT SHOULD NOT BE USED IN PRODUCTION. 
//FEEL FREE TO RUN THIS FILE AND MODIFY VALUES AS NEEDED TO TEST OUT THE APP.
//TO RUN THIS FILE, USE THE COMMAND: npx prisma db seed


async function main() {


const household = await prisma.households.upsert({
  where: { invite_code: "TEST123" },
  update: {
    name: "Test Household",
    description: "Seed household"
  },
  create: {
    name: "Test Household",
    invite_code: "TEST123",
    description: "Seed household"
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
      { user_id: user1.id, household_id: household.id, role: "Admin" },
      { user_id: user2.id, household_id: household.id },
      { user_id: user3.id, household_id: household.id }
    ]
  });

 
  const groceries = await prisma.expense_categories.create({
    data: {
      name: "Groceries",
      household_id: household.id
    }
  });

 
  const expense = await prisma.expenses.create({
    data: {
      description: "Weekly groceries",
      expense_name: "Groceries",
      amount: 90,
      household_id: household.id,
      creator_user_id: user1.id,
      payer_user_id: user1.id,
      expense_date: new Date(),
      expense_category_id: groceries.id
    }
  });

 
  await prisma.expense_splits.createMany({
    data: [
      { expense_id: expense.id, user_id: user1.id, amount_to_pay: 30 },
      { expense_id: expense.id, user_id: user2.id, amount_to_pay: 30 },
      { expense_id: expense.id, user_id: user3.id, amount_to_pay: 30 }
    ]
  });


  await prisma.settlements.create({
    data: {
      household_id: household.id,
      payer_user_id: user2.id,
      recipient_user_id: user1.id,
      amount: 30,
      payment_method: "Venmo"
    }
  });

  console.log("Seed data inserted.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });