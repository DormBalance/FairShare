# FairShare Database Contract

## Purpose
This document defines the main database tables, key columns, and relationships for the FairShare application. Its purpose is to give the development team a clear contract for backend and API development so endpoints can be built without directly inspecting SQL.

---

## 1. `households`
Stores each shared household/group in the application.

### Key columns
- `id` — Primary key for the household
- `created_at` — Timestamp when the household was created
- `updated_at` — Timestamp of the most recent update
- `name` — Household display name
- `invite_code` — Unique code used to join the household
- `description` — Optional description of the household

### Notes
- `invite_code` must be unique
- One household can have many members, expenses, settlements, recurring expenses, and categories

---

## 2. `users`
Stores application users.

### Key columns
- `id` — Primary key for the user
- `created_at` — Timestamp when the user was created
- `updated_at` — Timestamp of the most recent update
- `first_name` — User first name
- `last_name` — User last name
- `email` — Unique user email address

### Notes
- `email` must be unique
- One user can belong to many households through `household_members`
- One user can create/pay expenses, create/pay recurring expenses, send/receive settlements, and appear in expense splits

---

## 3. `household_members`
Join table connecting users to households and storing role information.

### Key columns
- `id` — Primary key
- `user_id` — References `users.id`
- `household_id` — References `households.id`
- `role` — Household role (`Admin` or `Member`)
- `time_joined` — Timestamp when the user joined the household

### Notes
- A user can only appear once per household
- `(user_id, household_id)` is unique
- Used for authorization and access control in household-scoped features

---

## 4. `expense_categories`
Stores expense categories for a household.

### Key columns
- `id` — Primary key
- `name` — Category name
- `created_at` — Timestamp when the category was created
- `household_id` — References `households.id`

### Notes
- Category names must be unique within a household
- Different households may reuse the same category names
- Used to organize expenses and recurring expenses

---

## 5. `expenses`
Stores one-time expense records.

### Key columns
- `id` — Primary key
- `created_at` — Timestamp when the expense was created
- `updated_at` — Timestamp of the most recent update
- `description` — Expense description/details
- `household_id` — References `households.id`
- `creator_user_id` — References `users.id`; user who created the expense entry
- `payer_user_id` — References `users.id`; user who paid
- `amount` — Total expense amount
- `expense_name` — Short title/name of the expense
- `split_type` — Split method (`Equal` or `Custom`)
- `expense_date` — Date the expense occurred
- `recurring_expense_id` — Optional reference to `recurring_expenses.id`
- `expense_category_id` — Optional reference to `expense_categories.id`

### Notes
- Every expense belongs to exactly one household
- Each expense may have many associated split rows in `expense_splits`
- `creator_user_id` and `payer_user_id` may be different

---

## 6. `expense_splits`
Stores how an expense is divided among users.

### Key columns
- `id` — Primary key
- `created_at` — Timestamp when the split row was created
- `expense_id` — References `expenses.id`
- `user_id` — References `users.id`
- `amount_to_pay` — Amount assigned to that user
- `opted_out` — Whether the user was excluded from the split

### Notes
- One row per user per expense
- `(expense_id, user_id)` is unique
- Used to calculate balances and “who owes who”

---

## 7. `settlements`
Stores payments made between users to settle balances.

### Key columns
- `id` — Primary key
- `created_at` — Timestamp when the settlement was created
- `amount` — Settlement amount
- `household_id` — References `households.id`
- `payer_user_id` — References `users.id`; person sending payment
- `recipient_user_id` — References `users.id`; person receiving payment
- `payment_method` — Method used for payment (e.g. Venmo, Cash, Zelle)
- `payment_date` — Date/time the payment was made

### Notes
- Each settlement belongs to one household
- Used to reduce outstanding balances between users
- `payer_user_id` and `recipient_user_id` should not be the same user

---

## 8. `recurring_expenses`
Stores recurring bills or repeating expenses.

### Key columns
- `id` — Primary key
- `created_at` — Timestamp when the recurring expense was created
- `updated_at` — Timestamp of the most recent update
- `description` — Description/details
- `household_id` — References `households.id`
- `creator_user_id` — References `users.id`
- `payer_user_id` — References `users.id`
- `amount` — Recurring amount
- `expense_name` — Name/title of recurring bill
- `expense_category_id` — Optional reference to `expense_categories.id`
- `is_active` — Whether the recurring expense is currently active
- `frequency` — Recurrence frequency (`Weekly` or `Monthly`)
- `next_expense_date` — Next scheduled generation date

### Notes
- Used for recurring bills like rent, utilities, subscriptions, etc.
- Can later generate rows in `expenses`
- If inactive, the recurring expense should not generate new records

---

# Relationship Summary

- One `household` has many:
  - `household_members`
  - `expense_categories`
  - `expenses`
  - `settlements`
  - `recurring_expenses`

- One `user` has many:
  - `household_members`
  - created expenses
  - paid expenses
  - created recurring expenses
  - paid recurring expenses
  - settlements paid
  - settlements received
  - expense splits

- One `expense` has many:
  - `expense_splits`

- One `recurring_expense` may be linked to many generated `expenses`

---

# Important Constraints

- `households.invite_code` must be unique
- `users.email` must be unique
- `household_members(user_id, household_id)` must be unique
- `expense_categories(name, household_id)` must be unique
- `expense_splits(expense_id, user_id)` must be unique

---

# Developer Use Notes

- All household-scoped queries should filter by `household_id`
- Authorization should rely on `household_members.role`
- Balance calculations should use both `expense_splits` and `settlements`
- Recurring expense generation should reference `next_expense_date` and `is_active`