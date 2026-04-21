const SETTLEMENTS_URL = "http://localhost:3000/api/settlements";

interface CreateSettlementBody {
    household_id: string;
    payer_user_id: string;
    recipient_user_id: string;
    amount: string | number;
    payment_method: string;
    payment_date?: string;
}

//#region 'GET' method tests
async function GetSettlementsValid() {
    // Test getting all settlements for a household '1'
    
    let householdId = "1";
    let url = `${SETTLEMENTS_URL}?household_id=${householdId}`;

    let response = await fetch(url, { method: "GET" });

    if (response.ok) {
        let settlements = await response.json();
        console.log("---------- TEST PASSED: GetSettlementsValid ----------")
        console.log(`   Successfully retrieved settlements for household ${householdId}. Count: ${settlements.length}`);
    }
    else {
        console.log("---------- TEST FAILED: GetSettlementsValid ----------");
        console.error(`   Failed to retrieve settlements for household ${householdId}. Status:`, response.status);
    }
}

async function GetSettlementInvalid() {
    // Test with invalid householdId
    let householdId = "6767a";
    let url = `${SETTLEMENTS_URL}?household_id=${householdId}`;

    let response = await fetch(url, { method: "GET" });

    if (!response.ok) {
        console.log("---------- TEST PASSED: GetSettlementInvalid ----------")
        console.log(`   Successfully rejected invalid household ID ${householdId}.`);
    }
    else {
        console.log("---------- TEST FAILED: GetSettlementInvalid ----------");
        console.error(`   Failed to reject invalid household ID ${householdId}.`);
    }
}

//#endregion

// #region 'POST' method tests
async function CreateSettlementValid() {
    let url = `${SETTLEMENTS_URL}`;

    let body: CreateSettlementBody = {
        household_id: "1",
        payer_user_id: "1",
        recipient_user_id: "2",
        amount: 50,
        payment_method: "Venmo",
        payment_date: new Date().toISOString(),
    };

    let response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (response.ok) {
        console.log("---------- TEST PASSED: CreateSettlementValid ----------")
        console.log("   Successfully created settlement.");
    }
    else {
        console.log("---------- TEST FAILED: CreateSettlementValid ----------");
        console.error("   Failed to create settlement. Status:", response.status);
    }
}

async function CreateSettlementInvalid() {
    let url = `${SETTLEMENTS_URL}`;

    let body: CreateSettlementBody = {
        household_id: "1",
        payer_user_id: "1",
        recipient_user_id: "2",
        amount: -50, // Invalid negative amount
        payment_method: "Venmo",
        payment_date: new Date().toISOString(),
    };

    let response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        console.log("---------- TEST PASSED: CreateSettlementInvalid ----------")
        console.log("   Successfully rejected invalid settlement.");
    }
    else {
        console.log("---------- TEST FAILED: CreateSettlementInvalid ----------");
        console.error("   Failed to reject INVALID settlement. Status:", response.status);
    }
}

// #endregion

export async function runSettlementsTests() {
    console.log("Running Settlements API tests...");
    console.log("--------------------------------------------------");
    console.log("Testing GetSettlementsValid-------------------------");
    await GetSettlementsValid();
    console.log("Testing GetSettlementInvalid-----------------------");
    await GetSettlementInvalid();
    console.log("Testing CreateSettlementValid----------------------");
    await CreateSettlementValid();
    console.log("Testing CreateSettlementInvalid---------------------");
    await CreateSettlementInvalid();
}

runSettlementsTests();