# FairShare

**A full-stack shared expense tracking platform for college roommates.**

FairShare eliminates the awkward "who owes who" conversation by giving households a single, transparent place to log expenses, split bills, and record settle-up payments. No more Excel sheets. No more Venmo screenshot debates.

> 🚧 Active development — website publishing in progress. Android mobile app planned.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Project Management](#project-management)
- [Team](#team)

---

## Overview

FairShare is built around the concept of a **household** — a group of roommates sharing a living space. Members of a household can:

- Log one-time or recurring shared expenses
- Split bills equally, by custom amount, or by percentage
- Track real-time balances showing exactly who owes whom
- Record settle-up payments (Venmo, Zelle, cash, etc.)
- Manage household membership with invite codes and role-based permissions

The entire app is serverless — the Next.js API routes handle all backend logic and connect directly to a PostgreSQL database hosted on Supabase, deployed to Vercel.

---

## Features

### Authentication
- Secure registration and login via **Supabase Auth**
- JWT-based session management with Bearer token validation on every API route
- Password hashing handled by Supabase (never stored in plain text)

### Households
- Create a household or join one via a unique invite code
- Email-based invite system for adding roommates
- Users can belong to multiple households simultaneously

### Role-Based Access Control
| Role | Permissions |
|---|---|
| **Admin** | Manage members, manage categories, full expense access |
| **Member** | Add expenses, view balances, record settlements |

### Expense Tracking
- Add shared or personal expenses with name, amount, date, description, and category
- Filter and browse expense history by month or category
- Link expenses to custom household categories (rent, groceries, utilities, etc.)

### Expense Splitting
- **Equal split** — divided automatically among all members
- **Custom split** — specify exact amounts per person
- Members can opt out of individual splits
- Real-time balance recalculation on every change

### Recurring Bills
- Create recurring bill templates (rent, internet, utilities)
- Automatic expense generation on weekly or monthly schedules via `/api/recurring_expenses/run-due`
- Active/inactive toggle to pause bills without deleting them

### Balances & Settlements
- Live balance dashboard showing net amounts owed across all expenses and payments
- Record settle-up payments with payment method and date
- Full payment history stored per household for transparency

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, TypeScript, Next.js (App Router) |
| **Backend** | Next.js API Routes (serverless, Node.js runtime) |
| **Database** | PostgreSQL (hosted on Supabase) |
| **ORM** | Prisma |
| **Authentication** | Supabase Auth (JWT) |
| **Hosting** | Vercel |
| **Local Dev** | Docker Compose |
| **Version Control** | GitHub (branch protections, PR reviews) |

---

## Architecture

```
┌─────────────────────────────────────┐
│           Next.js (Vercel)          │
│                                     │
│  ┌──────────────┐  ┌─────────────┐  │
│  │  React UI    │  │  API Routes │  │
│  │  (App Router)│  │  /api/...   │  │
│  └──────┬───────┘  └──────┬──────┘  │
│         │                 │         │
└─────────┼─────────────────┼─────────┘
          │                 │
          │        ┌────────▼────────┐
          │        │   Prisma ORM    │
          │        └────────┬────────┘
          │                 │
          │        ┌────────▼────────┐
          │        │   PostgreSQL    │
          │        │   (Supabase)    │
          │        └─────────────────┘
          │
   ┌──────▼──────┐
   │  Supabase   │
   │    Auth     │
   └─────────────┘
```

All API routes enforce authentication via shared middleware helpers (`lib/auth_helpers.tsx`). Any endpoint is protected in two lines:

```ts
import { requireUser, requireMember, requireAdmin } from '@/lib/auth_helpers'

// Require a logged-in user
const user = await requireUser(request)

// Require household membership
const { dbUser, member } = await requireMember(householdId, user)

// Require admin role
await requireAdmin(householdId, user)
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET/PATCH | `/api/auth/profile` | Get or update the current user's profile |
| GET | `/api/balances` | Get net balances for all members in a household |
| GET/POST/DELETE | `/api/expense_category` | Manage expense categories |
| GET/POST/PATCH/DELETE | `/api/expenses` | Manage one-time expenses |
| GET/POST/PATCH/DELETE | `/api/recurring_expenses` | Manage recurring bill templates |
| POST | `/api/recurring_expenses/run-due` | Trigger generation of due recurring expenses |
| GET/POST/PATCH/DELETE | `/api/settlements` | Manage settle-up payments |
| GET/POST | `/api/households` | List or create households |
| GET/POST | `/api/households/[id]/members` | List or add household members |
| PATCH/DELETE | `/api/households/[id]/members/[userId]` | Update or remove a specific member |
| POST | `/api/households/[id]/send-invite` | Send an email invite to join a household |
| POST | `/api/households/join` | Join a household via invite code |
| GET/DELETE | `/api/household_members` | Manage current user's household memberships |

---

## Database Schema

Eight relational tables connected through foreign keys:

```
users ──────────────────────────────────────────────────────┐
  │                                                          │
  ├── household_members ──── households ──┬── expense_categories
  │         (role: Admin/Member)          ├── expenses ──── expense_splits
  │                                       ├── settlements
  │                                       └── recurring_expenses
  │
  └── (creator/payer on expenses, settlements, recurring_expenses)
```

Key constraints:
- `households.invite_code` — unique
- `users.email` — unique  
- `(user_id, household_id)` in `household_members` — unique
- `(name, household_id)` in `expense_categories` — unique
- `(expense_id, user_id)` in `expense_splits` — unique

See [`DatabaseGuide.md`](./DatabaseGuide.md) for the full schema contract.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop
- A Supabase project (free tier works)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/DormBalance/FairShare.git
cd FairShare

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your Supabase URL, anon key, and database connection string

# 4. Start the local database
docker compose up -d

# 5. Apply database migrations
npx prisma migrate dev

# 6. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_postgresql_connection_string
```

---

## Project Management

- **Branching:** All work on feature branches — `feature/auth`, `fix/balance-calculation`, etc.
- **Pull Requests:** Required for all merges into `main`; at least one team member approval needed
- **Issues:** GitHub Issues for task tracking
- **Sprints:** GitHub Projects board for sprint planning

See [`CONTRIBUTING.md`](./CONTRIBUTTING.md) for the full branching and PR guide.

---

## Team

| Name | Role | GitHub |
|---|---|---|
| Guillermo Novillo | Project Lead | [@Gnovillo1120](https://github.com/Gnovillo1120) |
| Anthony Johnson | Developer | — |
| Gabriel Lopez-Garcia | Developer | — |
| Zachary Suero | Developer | — |

---

*FairShare — because roommates shouldn't have to argue over Venmo screenshots.*

### Email invites and recurring processing

Set `RESEND_API_KEY` on the server to enable email invites. The configured sender domain must be verified in Resend. The legacy `RESEBD_API_KEY` name is also accepted.

To generate due recurring expenses automatically, configure a scheduler to send `POST /api/recurring_expenses/run-due` with an `Authorization: Bearer <CRON_SECRET>` header. Set the matching `CRON_SECRET` in the application's server environment.

For the split calculation tests, run `npm exec -- tsx --test utilities/expenseSplit.test.ts`.
