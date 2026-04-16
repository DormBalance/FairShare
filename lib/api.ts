// import all types for expenses in types/expenses.ts
import { CreateExpenseRequest, ExpenseFilters, GetExpenseResponse, CreateExpenseResponse } from '@/types';
import { CreateExpenseCategoryRequest, GetExpenseCategoryResponse, CreateExpenseCategoryResponse } from '@/types/expense_category';

// #region API Result Type and Helper Functions
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Helper functions for creating Result types
export function successResponse<T>(data: T): Result<T> {
  return { success: true, data };
}

export function failResponse<T>(error: string): Result<T> {
  return { success: false, error };
}

function handleErrorMessage(err: unknown): string {
  if (err instanceof Error)
    return err.message;
  
  return 'An unexpected error occurred';
}
//#endregion

// Create a new expense with createExpenseRequest data
export async function createExpense(expenseData: CreateExpenseRequest): Promise<Result<CreateExpenseResponse>> {
  try {
    let createRequest = await fetch('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });

    if (!createRequest.ok) {
      let error = await createRequest.json();
      return failResponse(error.error);
    }

    let result = await createRequest.json();
    return successResponse(result.expense);
  }
  catch (err) {
    return failResponse(handleErrorMessage(err));
  }
}

// Get expenses for a given householdID with optional filters
export async function getExpenses(householdId: string, filters?: ExpenseFilters): Promise<Result<GetExpenseResponse[]>> {
  try {
    let url = `/api/expenses?household_id=${encodeURIComponent(householdId)}`;

    if (filters?.max_amount !== undefined)
      url += `&max_amount=${encodeURIComponent(filters.max_amount)}`;

    if (filters?.min_amount !== undefined)
      url += `&min_amount=${encodeURIComponent(filters.min_amount)}`;

    if (filters?.start_date)
      url += `&start_date=${encodeURIComponent(filters.start_date)}`;

    if (filters?.end_date)
      url += `&end_date=${encodeURIComponent(filters.end_date)}`;

    if (filters?.expense_category_id)
      url += `&expense_category_id=${encodeURIComponent(filters.expense_category_id)}`;

    let response = await fetch(url);

    if (!response.ok) {
      let error = await response.json();
      return failResponse(error.error);
    }

    let result = await response.json();
    return successResponse(result.expenses);
  }
  catch (err) {
    return failResponse(handleErrorMessage(err));
  }
}

// Get expense category by its ID and household ID
export async function getExpenseCategory(householdId: string, expenseCategoryId: string): Promise<Result<GetExpenseCategoryResponse>> {
  try {
    let url = `/api/expense_category?household_id=${encodeURIComponent(householdId)}&expense_category_id=${encodeURIComponent(expenseCategoryId)}`;

    let response = await fetch(url);

    if (!response.ok) {
      let error = await response.json();
      return failResponse(error.error);
    }

    let result = await response.json();
    return successResponse({
      id: expenseCategoryId,
      category_name: result.category_name
    });
  }

  catch (err) {
    return failResponse(handleErrorMessage(err));
  }
}

// Create a new expense category
export async function createExpenseCategory(data: CreateExpenseCategoryRequest): Promise<Result<CreateExpenseCategoryResponse>> {
  try {
    let response = await fetch('/api/expense_category', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let error = await response.json();
      return failResponse(error.error);
    }

    let result = await response.json();
    return successResponse({
      category_id: result.category_id,
      category_name: result.category_name
    });
  }
  catch (err) {
    return failResponse(handleErrorMessage(err));
  }
}
