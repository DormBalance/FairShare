"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/auth/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { getRecurringExpenses } from "@/lib/api";
import { GetRecurringExpenseResponse } from "@/types";
import CreateExpenseModal from "@/components/CreateExpenseModal";
import "../dashboard/dashboard.css";
import "./recurring.css";

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

export default function RecurringPage() {
    const { session, user } = useAuth();
    let [householdID, setHouseholdID] = useState("");
    let [currUser, setCurrUser] = useState("");
    let [recurringExpenses, setRecurringExpenses] = useState<GetRecurringExpenseResponse[]>([]);
    let [loading, setLoading] = useState<boolean>(true);
    let [error, setError] = useState<string>("");
    let [showCreateModal, setShowCreateModal] = useState<boolean>(false);

    // Copied from dashboard/page.tsx pattern — fetches household and DB user ID via API
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

    async function loadRecurringExpenses() {
        if (!householdID) return;
        setLoading(true);
        setError("");

        let result = await getRecurringExpenses(householdID);

        if (result.success === false) {
            setError(result.error);
            setLoading(false);
            return;
        }

        setRecurringExpenses(result.data);
        setLoading(false);
    }

    useEffect(() => { loadRecurringExpenses() }, [householdID]);

    return (
        <DashboardLayout>
            <div className="page-header">
                <h1 className="page-title">Recurring Expenses</h1>
                <div className="page-features">
                    <button className="add-expense-btn"
                        onClick={() => setShowCreateModal(true)}>
                        Add Recurring Expense
                    </button>

                </div>
            </div>

            {error && <p style={{ color: "red", marginBottom: 16}}>{error}</p>}
            {loading && <p style={{ color: "#888", marginBottom: 16}}>Loading...</p>}

            <div className="recent-expenses-card">
                <div className="recent-expenses-row recent-expenses-row-header">
                    <span>Name</span>
                    <span>Amount</span>
                    <span>Frequency</span>
                    <span>Next Due</span>
                    <span>Payer</span>
                    <span>Status</span>
                </div>
                {recurringExpenses.map((expense) => (
                    <div className="recent-expenses-row"
                        key={expense.id}
                        
                        style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 0.8fr"}}>
                            <span>{expense.expense_name}</span>
                            
                            <span>{formatCurrency(Number(expense.amount))}</span>
                            
                            <span>
                                <span className="frequency-badge">{expense.frequency}</span>
                            </span>
                            
                            <span>{formatDate(expense.next_expense_date)}</span>
                            
                            <span>
                                {expense.recurring_expense_payer.first_name}
                                {" "}
                                {expense.recurring_expense_payer.last_name}
                            </span>

                            <span className={expense.is_active
                                ? "status-badge-active"
                                : "status-badge-inactive"}>
                                {expense.is_active ? "Active" : "Inactive"}
                            </span>
                    </div>
                ))}

                {recurringExpenses.length === 0 && !loading && (
                    <p style={{ padding: "24px 28px", color: "#888"}}>
                        No recurring expenses yet.
                        </p>
                )}
            </div>

            <CreateExpenseModal
                isOpen         = {showCreateModal}
                onClose        = {() => setShowCreateModal(false)}
                onSuccess      = {loadRecurringExpenses}
                curUserID      = {currUser}
                curHouseholdID = {householdID}
            />
        </DashboardLayout>
    )
}