export type SplitType = 'Equal' | 'Custom';

export type ExpenseParticipant = {
  user_id: string;
  percent: number;
};

export type CreateExpenseRequest = {
  expense_name: string;
  amount: string | number;
  split_type: SplitType;
  expense_date: string;
  creator_user_id: string;
  participants?: ExpenseParticipant[];
  household_id: string;
  payer_user_id: string;
  description?: string;
  recurring_expense_id?: string;
  expense_category_id?: string;
  excluded_user_ids?: string[];
  included_user_ids?: string[];
};

export type ExpenseFilters = {
  expense_category_id?: string;
  start_date?: string;
  end_date?: string;
  max_amount?: number;
  min_amount?: number;
};

export type UserInfo = {
  id: string;
  first_name: string;
  last_name: string;
};

export type ExpenseCategory = {
  id: string;
  category_name: string;
};

export type ExpenseSplit = {
  id: string;
  user_id: string;
  amount_to_pay: string | number;
  opted_out: boolean;
};

export type CreateExpenseResponse = {
  id: string;
  expense_name: string;
  amount: string | number;
  description: string;
  creator_user_id: string;
  payer_user_id: string;
  household_id: string;
  expense_date: string;
  split_type: SplitType;
  recurring_expense_id?: string;
  expense_category_id?: string;
  included_user_ids?: string[];
  excluded_user_ids?: string[];
  participants: ExpenseParticipant[];
};

export type GetExpenseResponse = {
    id: string;
    expense_name: string;
    creator_user_id: string;
    amount: string | number;
    payer_user_id: string;
    household_id: string;
    description: string;
    split_type: SplitType;
    expense_date: string;
    expense_payer: UserInfo;
    expense_creator: UserInfo;
    expense_category: ExpenseCategory;
    splits: ExpenseSplit[];
    recurring_expense_id?: string;
    expense_category_id?: string;
};

export type HouseholdMember = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

export type RecurringExpenseFrequency = 'Weekly' | 'Monthly';

export type GetRecurringExpenseResponse = {
  id: string;
  expense_name: string;
  description:string;
  amount: string | number;
  frequency: RecurringExpenseFrequency;
  next_expense_date: string;
  is_active: boolean;
  split_type: SplitType;
  household_id: string;
  creator_user_id: string;
  payer_user_id: string;
  expense_category_id?: string;
  recurring_expense_creator: UserInfo;
  recurring_expense_payer: UserInfo;
  splits: ExpenseSplit[];
}

export type RunDueResponse = {
  due_count: number;
  created_count: number;
  skipped_count: number;
  details: {
    recurring_expense_id: string;
    expense_id?: string;
    status: 'created' | 'skipped';
  }[]
}

export type CreateSettlementRequest = {
  household_id: string;
  payer_user_id: string;
  recipient_user_id: string;
  amount: string | number;
  payment_method: string;
  payment_date?: string;
}

export type GetSettlementResponse = {
  id: string;
  household_id: string;
  payer_user_id: string;
  recipient_user_id: string;
  amount: string | number;
  payment_method: string;
  payment_date: string;
  created_at: string;
  settlement_payer: UserInfo;
  settlement_recipient: UserInfo;
}

export type BalanceEntry = {
  from: string;
  to: string;
  amount: string;
}