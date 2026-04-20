"use client";
 
//lines 4 to 49 are just copy and pasted from dashboard page

import { useEffect, useState } from "react";
import { useAuth } from "@/app/auth/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { getExpenses } from "@/lib/api";
import { GetExpenseResponse } from "@/types";
import {Search} from "lucide-react";
import RecentExpensesCard from "@/components/RecentExpensesCard";
import "../dashboard/dashboard.css";
import "./expenses.css";
import CreateExpenseModal from "@/components/CreateExpenseModal";


function formatDate(dateString: string): string{
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatCurrency(amount: number): string{
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

function generateStatusText(expense: GetExpenseResponse, currentUser: string): string{
    let payer = expense.payer_user_id === currentUser;
    if(payer){
        let amountOwed = expense.splits.filter((s) => s.user_id !== currentUser && !s.opted_out).reduce((sum,s) => sum + Number(s.amount_to_pay), 0); //line generated with copilot
        if(amountOwed === 0){
            return "Settled Up";
        }
        return `You are owed ${formatCurrency(amountOwed)}`;
        }
        let userSplit = expense.splits.find((s) => s.user_id === currentUser);
        if(!userSplit || userSplit.opted_out){
            return "Settled Up";
        }

        let amountOwed = Number(userSplit.amount_to_pay);
        if(amountOwed === 0){
            return "Settled Up";
        }
        return `You owe ${formatCurrency(amountOwed)}`;
}


export default function ExpensesPage() {
    const { session, user } = useAuth();
    let [householdID, setHouseholdID] = useState("");
    let [currUser, setCurrUser] = useState("");
    let [expenses, setExpenses] = useState<GetExpenseResponse[]>([]);
    let[loading, setLoading] = useState(true);
    let [error, setError] = useState("");
    let [showCreateModal, setShowCreateModal] = useState(false);
    let[tab, setTab] = useState<"all" | "yours">("all");
    let[search, setSearch] = useState("");

    // Claude debug: expenses weren't loading because currUser was the Supabase UUID, not the Prisma DB user ID.
    // Fixed by copying the household + members fetch pattern from dashboard/page.tsx.
    useEffect(() => {
        if (!session?.access_token) return;
        async function loadHousehold() {
            const res = await fetch("/api/households", {
                headers: { "Authorization": `Bearer ${session.access_token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.length === 0) return;
            const household = data[0];
            setHouseholdID(String(household.id));
            const membersRes = await fetch(`/api/households/${household.id}/members`, {
                headers: { "Authorization": `Bearer ${session.access_token}` },
            });
            if (!membersRes.ok) return;
            const members = await membersRes.json();
            const me = members.find((m: any) => m.email === user?.email);
            if (me) setCurrUser(String(me.id));
        }
        loadHousehold();
    }, [session]);

    async function loadExpenses(){
        if (!householdID) return;
        setLoading(true);
        setError("");

        let result = await getExpenses(householdID);
        if(result.success === false){
            setError(result.error);
            setLoading(false);
            return;
        }

        setExpenses(result.data);
        setLoading(false);
    }

    useEffect(() => {
        loadExpenses();
    }, [householdID]);

    let expensesFilteredByTab;
    if (tab === "all"){
        expensesFilteredByTab = expenses;
    } else{
        expensesFilteredByTab = expenses.filter((expense) =>
            expense.payer_user_id === currUser || expense.splits.some((split) => split.user_id === currUser)
        );
    }

    let searchExpense = expensesFilteredByTab.filter((expense) =>{
        let expenseNameSearch = expense.expense_name.toLowerCase().includes(search.toLowerCase());
        let expensePayerMatch =  `${expense.expense_payer.first_name} ${expense.expense_payer.last_name}`.toLowerCase().includes(search.toLowerCase());
        return expenseNameSearch || expensePayerMatch;
    });   

    let allExpensesTabClass;
    if(tab === "all"){
        allExpensesTabClass = "active-expense-tab";
    } else{
        allExpensesTabClass = "expenses-tab";
    }

    let yourExpensesTabClass;
    if(tab === "yours"){
        yourExpensesTabClass = "active-expense-tab";
    } else{
        yourExpensesTabClass = "expenses-tab";
    }

    // lines 124 to 131 are copy and pasted from dashboard pages, with change to line 115 using searchExpense
     let expenseRows = searchExpense.map((expense) =>({
        id: Number(expense.id),
        description: expense.expense_name,
        paidBy: `${expense.expense_payer.first_name} ${expense.expense_payer.last_name}`,
        date: formatDate(expense.expense_date),
        total: formatCurrency(Number(expense.amount)),
        status:generateStatusText(expense,currUser),
    }))

    return(
        <DashboardLayout>
            <div className = "expense-page-header">
                <h1 className = "expense-page-title"> Expenses </h1>
                <button className = "add-expense-btn" onClick={() => setShowCreateModal(true)}>Add Expense</button>
            </div>

            <div className = "expense-page-controls">
                <div className = "expense-page-tabs">
                    <button className = {allExpensesTabClass} onClick = {() => setTab("all")}>All Household Expenses</button>
                    <button className = {yourExpensesTabClass} onClick = {() => setTab("yours")}>Your Expenses</button>
                </div>

                <div className = "expense-page-search-bar">
                    <Search size = {16}/>
                    <input placeholder="Search expenses" value={search} onChange={(expense) => setSearch(expense.target.value)}/>
                </div>
            </div>
            {error && <p style={{color: "red", marginBottom: 16}}>{error}</p>}
            {loading && <p style={{color: "#888", marginBottom: 16}}>Loading...</p>}

            <RecentExpensesCard rows={expenseRows} maxRows={Infinity} viewAll={false} scrollable={true}/>

            <CreateExpenseModal
                isOpen         = {showCreateModal}
                onClose        = {() => setShowCreateModal(false)}
                onSuccess      = {loadExpenses}
                curUserID      = {currUser}
                curHouseholdID = {householdID}
            />
        </DashboardLayout>
    );
}


