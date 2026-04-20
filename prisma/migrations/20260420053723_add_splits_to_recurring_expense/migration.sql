/*
  Warnings:

  - A unique constraint covering the columns `[recurring_expense_id,user_id]` on the table `expense_splits` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "expense_splits" ADD COLUMN     "recurring_expense_id" BIGINT,
ALTER COLUMN "expense_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "recurring_expenses" ADD COLUMN     "split_type" "SplitType" NOT NULL DEFAULT 'Equal';

-- CreateIndex
CREATE INDEX "expense_splits_recurring_expense_id_idx" ON "expense_splits"("recurring_expense_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_splits_recurring_expense_id_user_id_key" ON "expense_splits"("recurring_expense_id", "user_id");

-- AddForeignKey
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_recurring_expense_id_fkey" FOREIGN KEY ("recurring_expense_id") REFERENCES "recurring_expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
