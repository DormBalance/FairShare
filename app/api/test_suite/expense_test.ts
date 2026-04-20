
const EXPENSES_URL = "http://localhost:3000/api/expenses";

interface CreateExpenseBody {
  expense_name: string;
  description?: string;
  household_id: string;
  creator_user_id: string;
  payer_user_id?: string;
  amount: string | number;
  split_type: string;
  expense_date: string;
  recurring_expense_id?: string;
  expense_category_id?: string;
  excluded_user_ids?: string[];
  included_user_ids?: string[];
  participants?: {
    user_id: string;
    percent: number;
  }[];
}

function CheckIfExpenseCreatedSuccessfully(response: Response) {
    if (!response.ok) {
        console.error(" Failed to create expense. Status:", response.status);
        return false;
    }
    
    return true;
}

//#region 'GET' method tests
async function GetExpensesValid() {
    // Test for: all expenses within the lst day
    const householdId = "1";
    const start_date = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();// start 1 day ago

    let url = `${EXPENSES_URL}?household_id=${householdId}&start_date=${start_date}`;
    const response = await fetch(url, {
        method: "GET",
        headers: { 'Content-Type': 'application/json' }
    });

    let expenses = await response.json();
    if (response.ok && expenses !== null) {
        console.log("---------- TEST PASSED: GetExpensesValid ----------");
        console.log(`   Successfully retrieved ${expenses.length} expenses for household ${householdId}.`);
    }
    else {
        console.log("---------- TEST FAILED: GetExpensesValid ----------");
        console.log(`   Failed to retrieve ${expenses.length} expenses for household ${householdId}.`);
    }
}

async function getExpenseInvalid() {
    // Test for: invalid max amount (negative value)
    const householedId = "1";
    const max_amount = -100; // Invalid max amount
    const min_amount = 0;
    
    let url = `${EXPENSES_URL}?household_id=${householedId}&max_amount=${max_amount}&min_amount=${min_amount}`;
    const response = await fetch(url, {
        method: "GET",
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        console.log("---------- TEST PASSED: GetExpenseInvalid ----------");
        console.log("   Invalid max amount was correctly rejected.");
    }
    else {
        console.log("---------- TEST FAILED: GetExpenseInvalid ----------");
        console.error("   Invalid max amount was not rejected.");
    }   
}
//#endregion

// #region 'POST' method tests
async function PostEqualSplitValid() {
    const requestBody: CreateExpenseBody = {
        expense_name: "Dinner Even-Split",
        description: `INTEGRATION TEST (PostEqualSplitValid): ${new Date().toISOString()}`,
        household_id: "1",
        creator_user_id: "1",
        payer_user_id: "1",
        amount: 100,
        split_type: "Equal",
        expense_category_id: "2",
        expense_date: new Date().toISOString(),
        included_user_ids: ["1", "2"],
    };

    const response = await fetch(EXPENSES_URL, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });
    
    if (CheckIfExpenseCreatedSuccessfully(response)) {
        console.log("---------- TEST PASSED: PostEqualSplitValid ----------");
        console.log("   Expense created successfully with equal split.");
    }
    else {
        console.log("---------- TEST FAILED: PostEqualSplitValid ----------");
        console.error("   Expense failed to be created with equal split.");
    }   
}

async function PostCustomSplitValid() {
    const requestBody: CreateExpenseBody = {
        expense_name: "Dinner Custom-Split",
        description: `INTEGRATION TEST (PostCustomSplitValid): ${new Date().toISOString()}`,
        household_id: "1",
        creator_user_id: "1",
        payer_user_id: "1",
        amount: 100,
        split_type: "Custom",
        expense_category_id: "2",
        expense_date: new Date().toISOString(),
        participants: [
            { user_id: "1", percent: 60 },
            { user_id: "2", percent: 40 },
        ],
        included_user_ids: ["1", "2"],
    };

    const response = await fetch(EXPENSES_URL, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });
    
    if (await CheckIfExpenseCreatedSuccessfully(response)) {
        console.log("---------- TEST PASSED: PostCustomSplitValid ----------");
        console.log("   Expense created successfully with custom split.");
    }
    else {
        console.log("---------- TEST FAILED: PostCustomSplitValid ----------");
        console.error("   Expense failed to be created with custom split.");
    }
}

async function PostCustomSplitInvalid() {
    const requestBody: CreateExpenseBody = {
        expense_name: "Dinner Custom-Split INVALID",
        description: `INTEGRATION TEST (PostCustomSplitInvalid): ${new Date().toISOString()}`,
        household_id: "1",
        creator_user_id: "1",
        payer_user_id: "1",
        amount: 100,
        split_type: "Custom",
        expense_category_id: "2",
        expense_date: new Date().toISOString(),
        participants: [
            { user_id: "1", percent: 60 },
            { user_id: "2", percent: 60 },
        ],
        included_user_ids: ["1", "2"]
    };

    const response = await fetch(EXPENSES_URL, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });
    
    if (await CheckIfExpenseCreatedSuccessfully(response)) {
        console.log("---------- TEST FAILED: PostCustomSplitInvalid ----------");
        console.log("   Invalid expense was not rejected.");
    }
    else {
        console.log("---------- TEST PASSED: PostCustomSplitInvalid ----------");
        console.error("   Invalid expense was correctly rejected.");
    }
}
//#endregion

//main function to run all tests
async function runExpenseTests() {
    console.log("Running Main API Tests");
    console.log("---------- Starting GetExpenseValid ----------\n");
    await GetExpensesValid();
    console.log("---------- Starting GetExpenseInvalid ----------\n");
    await getExpenseInvalid();
    console.log("---------- Starting PostEqualSplitValid ----------\n");
    await PostEqualSplitValid();
    console.log("---------- Starting PostCustomSplitValid ----------\n");
    await PostCustomSplitValid();
    console.log("---------- Starting PostCustomSplitInvalid ----------\n");
    await PostCustomSplitInvalid();
    console.log("Finished Main API Tests.");
}

runExpenseTests();