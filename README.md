# 🏠 FairShare  
*A shared expense & budgeting platform for college roommates*

---

## 📌 Overview
FairShare is a web-based application designed specifically for **college students living with roommates** who want a simple, transparent way to track shared and personal expenses.

Unlike generic budgeting apps, DormBalance focuses on **household-level expense sharing**, allowing roommates to split bills (rent, groceries, utilities), see exactly **who owes who**, and record settle-up payments—all in one place.

The system supports multiple households, role-based access, recurring bills, and a central database that updates dynamically as users interact with the app.

---

## 🎯 Target Users
- College students living with roommates  
- Apartment or dorm suites sharing rent, groceries, and utilities  
- Students who want clarity and fairness in shared spending  

---

## ✨ Key Features

### 🔐 User Authentication
- Secure user registration and login
- Passwords are safely hashed (never stored in plain text)
- User profiles with basic account information

---

### 🏡 Households (Groups)
- Create or join a household using an invite code
- Each household represents an apartment, dorm suite, or shared living space
- Users can belong to multiple households

---

### 👥 Roles & Permissions
- **Admin**
  - Manage household members
  - Manage categories
  - Resolve disputes (optional)
- **Member**
  - Add expenses
  - View balances
  - Record payments

---

### 💸 Expense Tracking
- Add personal or shared expenses
- Assign categories (rent, groceries, utilities, etc.)
- Include amount, date, and description
- Filter and view expense history by month or category

---

### 🔄 Expense Splitting
- Automatically split shared expenses between roommates
- Supported split methods:
  - Equal split
  - Custom amounts
  - Percentage-based splits (optional)
- Real-time calculation of balances

---

### 💰 Balances & Settlements
- Clear view of who owes whom
- Record settle-up payments (cash, Venmo, etc.)
- Payment history stored for transparency

---

### 🔁 Recurring Bills
- Create recurring bill templates (e.g., rent, internet, utilities)
- Automatically generate expenses on a schedule (weekly/monthly)
- Prevents missing or duplicate bill entries

---

## 🧠 How It Works (High Level)
1. Users create accounts and join a household
2. Shared expenses are logged and split among members
3. The system calculates balances based on expenses and payments
4. Recurring bills automatically generate expenses when due
5. All data is stored in a central database and updated dynamically

---

## 🗄️ Database & Data Requirements
- Dynamic relational database
- Stores users, households, expenses, splits, settlements, and recurring bills
- Includes seeded dummy data (100+ expense items) for testing and demo purposes
- Designed to scale beyond trivial datasets

---

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript (Next.js)
- **Backend:** Node.js (Next.js)
  - **Application Hosting:** Vercel
- **Database:** PostgreSQL
  - **Database Hosting:** Supabase
- **ORM:** Prisma
- **Authentication:** Supabase Auth
- **DevOps:** Docker (Local system)
- **Version Control:** GitHub with branch protections

---

## 📋 Project Management
- GitHub Issues for task tracking
- GitHub Projects board for sprint planning
- Feature branches with pull requests into protected `main` branch

---

## 🚀 Running the Project (Development)
Instructions will be added as development progresses.

Typical setup will include:
1. Cloning the repository
2. Installing dependencies
3. Setting environment variables
4. Running backend and database via Docker Compose
5. Running frontend locally

---

## 🔐 Auth & Role Helpers (For Developers)

All API routes should enforce authentication and roles using the shared helpers in `lib/auth_helpers.tsx`. Any endpoint can be protected in 2 lines.

### Import
```ts
import { requireUser, requireMember, requireAdmin } from '@/lib/auth_helpers'
```

---

### `requireUser(request)`
Validates the Bearer token from the request's `Authorization` header. Throws if the user is not authenticated.

Use this on any endpoint that requires a logged-in user.

```ts
export async function GET(request: NextRequest) {
  let user
  try {
    user = await requireUser(request)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // user is now a verified Supabase User object
}
```

---

### `requireMember(householdId, user)`
Checks that the authenticated user is a member of the given household. Throws if they are not.

Returns `{ dbUser, member }` — the user's database row and their membership record.

```ts
let user
try {
  user = await requireUser(request)
} catch {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

let dbUser
try {
  ({ dbUser } = await requireMember(BigInt(householdId), user))
} catch {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

### `requireAdmin(householdId, user)`
Same as `requireMember` but also checks that the user's role is `Admin`. Throws if they are not a member or not an admin.

Returns `{ dbUser, member }`.

```ts
let user
try {
  user = await requireUser(request)
} catch {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

try {
  await requireAdmin(BigInt(householdId), user)
} catch {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

---

## 👨‍💻 Team
Guillermo Novillo, Anthony Johnson, Gabriel Lopez-Garcia, Zachary Suero

---

*FairShare – because roommates shouldn’t have to argue over Venmo screenshots.*


---

*FairShare – because roommates shouldn’t have to argue over Venmo screenshots.*
