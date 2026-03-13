/*
  Warnings:

  - You are about to drop the column `admin_id` on the `households` table. All the data in the column will be lost.
  - You are about to drop the column `household_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `financials` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[invite_code]` on the table `households` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `invite_code` to the `households` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `households` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('Admin', 'Member');

-- CreateEnum
CREATE TYPE "RecurringExpenseFrequency" AS ENUM ('Weekly', 'Monthly');

-- CreateEnum
CREATE TYPE "SplitType" AS ENUM ('Equal', 'Custom');

-- DropForeignKey
ALTER TABLE "financials" DROP CONSTRAINT "financials_household_id_fkey";

-- DropForeignKey
ALTER TABLE "financials" DROP CONSTRAINT "financials_user_id_fkey";

-- DropForeignKey
ALTER TABLE "households" DROP CONSTRAINT "households_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_household_id_fkey";

-- AlterTable
ALTER TABLE "households" DROP COLUMN "admin_id",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "invite_code" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "household_id",
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "financials";

-- CreateTable
CREATE TABLE "expenses" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "household_id" BIGINT NOT NULL,
    "creator_user_id" BIGINT,
    "payer_user_id" BIGINT,
    "amount" DECIMAL(65,30) NOT NULL,
    "expense_name" TEXT NOT NULL,
    "split_type" "SplitType" NOT NULL DEFAULT 'Equal',
    "expense_date" TIMESTAMP(3) NOT NULL,
    "recurring_expense_id" BIGINT,
    "expense_category_id" BIGINT,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_expenses" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "household_id" BIGINT NOT NULL,
    "creator_user_id" BIGINT,
    "payer_user_id" BIGINT,
    "amount" DECIMAL(65,30) NOT NULL,
    "expense_name" TEXT NOT NULL,
    "expense_category_id" BIGINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "frequency" "RecurringExpenseFrequency" NOT NULL,
    "next_expense_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "household_id" BIGINT NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_members" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "household_id" BIGINT NOT NULL,
    "role" "HouseholdRole" NOT NULL DEFAULT 'Member',
    "time_joined" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(65,30) NOT NULL,
    "household_id" BIGINT NOT NULL,
    "payer_user_id" BIGINT NOT NULL,
    "recipient_user_id" BIGINT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_splits" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expense_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "amount_to_pay" DECIMAL(65,30) NOT NULL,
    "opted_out" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "expense_splits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expenses_payer_user_id_idx" ON "expenses"("payer_user_id");

-- CreateIndex
CREATE INDEX "expenses_expense_category_id_idx" ON "expenses"("expense_category_id");

-- CreateIndex
CREATE INDEX "expenses_household_id_expense_date_idx" ON "expenses"("household_id", "expense_date");

-- CreateIndex
CREATE INDEX "expenses_recurring_expense_id_idx" ON "expenses"("recurring_expense_id");

-- CreateIndex
CREATE INDEX "recurring_expenses_household_id_next_expense_date_idx" ON "recurring_expenses"("household_id", "next_expense_date");

-- CreateIndex
CREATE INDEX "recurring_expenses_payer_user_id_idx" ON "recurring_expenses"("payer_user_id");

-- CreateIndex
CREATE INDEX "recurring_expenses_creator_user_id_idx" ON "recurring_expenses"("creator_user_id");

-- CreateIndex
CREATE INDEX "recurring_expenses_expense_category_id_idx" ON "recurring_expenses"("expense_category_id");

-- CreateIndex
CREATE INDEX "expense_categories_household_id_idx" ON "expense_categories"("household_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_name_household_id_key" ON "expense_categories"("name", "household_id");

-- CreateIndex
CREATE INDEX "household_members_user_id_idx" ON "household_members"("user_id");

-- CreateIndex
CREATE INDEX "household_members_household_id_role_idx" ON "household_members"("household_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "household_members_user_id_household_id_key" ON "household_members"("user_id", "household_id");

-- CreateIndex
CREATE INDEX "settlements_payer_user_id_idx" ON "settlements"("payer_user_id");

-- CreateIndex
CREATE INDEX "settlements_recipient_user_id_idx" ON "settlements"("recipient_user_id");

-- CreateIndex
CREATE INDEX "settlements_payment_date_household_id_idx" ON "settlements"("payment_date", "household_id");

-- CreateIndex
CREATE INDEX "expense_splits_user_id_idx" ON "expense_splits"("user_id");

-- CreateIndex
CREATE INDEX "expense_splits_expense_id_idx" ON "expense_splits"("expense_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_splits_expense_id_user_id_key" ON "expense_splits"("expense_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "households_invite_code_key" ON "households"("invite_code");

-- CreateIndex
CREATE INDEX "households_invite_code_idx" ON "households"("invite_code");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_expense_category_id_fkey" FOREIGN KEY ("expense_category_id") REFERENCES "expense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_creator_user_id_fkey" FOREIGN KEY ("creator_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_payer_user_id_fkey" FOREIGN KEY ("payer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recurring_expense_id_fkey" FOREIGN KEY ("recurring_expense_id") REFERENCES "recurring_expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_expense_category_id_fkey" FOREIGN KEY ("expense_category_id") REFERENCES "expense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_creator_user_id_fkey" FOREIGN KEY ("creator_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_payer_user_id_fkey" FOREIGN KEY ("payer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_payer_user_id_fkey" FOREIGN KEY ("payer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
