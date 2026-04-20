"use client";
 
//NOTE WITH Authentication, uncoment the uncommented lines!
import { useEffect, useState } from "react";
//import { useAuth } from "@/app/auth/auth";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import RecentExpensesCard from "@/components/RecentExpensesCard";
import { getExpenses } from "@/lib/api";
import { GetExpenseResponse } from "@/types";
import "./dashboard.css";



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

function computeBalances(expenses: GetExpenseResponse[], currentUser: string ){
    let amountOwed = 0;
    let amountYouOwe = 0;

    for(let expense of expenses){
        let payer = expense.payer_user_id == currentUser;
        if(payer){
            let owed = expense.splits.filter((s) => s.user_id !== currentUser && !s.opted_out).reduce((sum,s) => sum + Number(s.amount_to_pay), 0); //line generated with copilot
            amountOwed += owed;
        } else{
            let userSplit = expense.splits.find((s) => s.user_id === currentUser);
            if(userSplit && !userSplit.opted_out){
                amountYouOwe += Number(userSplit.amount_to_pay);
            }
        }
    }
    return { amountOwed, amountYouOwe };
}

function generateStatusText(expense: GetExpenseResponse, currentUser: string): string{
    let payer = expense.payer_user_id === currentUser;
    if(payer){
        let amountOwed = expense.splits.filter((s) => s.user_id !== currentUser && !s.opted_out).reduce((sum,s) => sum + Number(s.amount_to_pay), 0); //line generated with copilot
        if(amountOwed === 0){
            return "Settled Up";
        }
        let firstName = expense.expense_payer?.first_name || "Someone";
        return `${firstName} owes you ${formatCurrency(amountOwed)}`;
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

export default function DashboardPage() {
    //const {user} = useAuth();
    let householdID: string = "1"; //these are hardocded values based on values that are currently in table. can delete once we have authentication.
    let currUser = "2";
    //let householdID: string = user?.user_metadata?.household_id ?? "";
    //let currUser = user?.id ?? "";
    let [expenses, setExpenses] = useState<GetExpenseResponse[]>([]);
    let[loading, setLoading] = useState(true);
    let [error, setError] = useState("");

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

    let {amountOwed, amountYouOwe} = computeBalances(expenses, currUser);
    let balance = amountOwed - amountYouOwe;

    let expenseRows = expenses.map((expense) =>({
        id: Number(expense.id),
        description: expense.expense_name,
        paidBy: `${expense.expense_payer.first_name} ${expense.expense_payer.last_name}`,
        date: formatDate(expense.expense_date),
        total: formatCurrency(Number(expense.amount)),
        status:generateStatusText(expense,currUser),
    }))

    return(
        <DashboardLayout>
            {error && <p style = {{color: "red", marginBottom: 16}}>{error}</p>}
            {loading && <p style = {{color: "#888", marginBottom: 16}}>Loading...</p>}

            <div className = "page-header">
                <h1 className = "page-title">Gator Grove Apt 3B</h1>
                <div className = "page-features">
                    <button className = "add-expense-btn">Add Expense</button>
                    <button className = "settle-up-btn">Settle Up</button>
                </div>
            </div>
            <div className = "stat-cards-row">
                <StatCard label = "You Owe" value = {amountYouOwe > 0 ? `-${formatCurrency(amountYouOwe)}` : formatCurrency(0)} />
                <StatCard label = "You're Owed" value = {formatCurrency(amountOwed)} />
                <StatCard label = "Balance" value = {balance >= 0 ? `+${formatCurrency(balance)}` : `-${formatCurrency(Math.abs(balance))}`} 
                    valueClassName={balance >= 0 ? "positive" : "negative"}/>
            </div>

            <RecentExpensesCard rows = {expenseRows} />
        </DashboardLayout>
    );
}
