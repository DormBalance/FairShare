"use client";
 
//lines 4 to 49 are just copy and pasted from dashboard page

import { useEffect, useState } from "react";
//import { useAuth } from "@/app/auth/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { getExpenses } from "@/lib/api";
import { GetExpenseResponse } from "@/types";
import "./expenses.css"


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

//this function was copy and paasted from RecentExpensesCard.tsx
function determineStatusClass(status: string): string{
    if (status.startsWith("You owe")){
        return "status-owe";
    } else if (status.includes("owes you")){
        return "status-owed";
    }
    return "status-settled";
}



export default function ExpensesPage() {
    //copy and pasted from dashboar page
    //const {user} = useAuth();
    let householdID: string = "4"; //these are hardocded values based on values that are currently in table. can delete once we have authentication.
    let currUser = "10";
    //let householdID: string = user?.user_metadata?.household_id ?? "";
    //let currUser = user?.id ?? "";
    let [expenses, setExpenses] = useState<GetExpenseResponse[]>([]);
    let[loading, setLoading] = useState(true);
    let [error, setError] = useState("");
    let[tab, setTab = useState("")];
    let[search, setSearch = useState("")];

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
    }, []);

    let
}


