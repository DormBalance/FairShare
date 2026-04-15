import { ExpenseFilters } from './expenses';

export type CreateExpenseCategoryRequest = {
  household_id: string;
  category_name: string;
};

export type CreateExpenseCategoryResponse = {
  category_id: string;
  category_name: string;
  status: number;
};

export type GetExpenseCategoryResponse = {
  category_name: string;
};

export type GetExpensesRequest = {
  householdId: string;
  filters?: ExpenseFilters;
};
