"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import HouseholdState from "@/components/HouseholdState";
import StatCard from "@/components/StatCard";
import SpendingChart from "@/components/SpendingChart";
import RecentExpensesCard from "@/components/RecentExpensesCard";
import CreateExpenseModal from "@/components/CreateExpenseModal";
import { getBalances, getExpenses } from "@/lib/api";
import { formatCurrency, formatDate, toCents } from "@/lib/format";
import { useHousehold } from "@/lib/useHousehold";
import type { BalanceEntry, GetExpenseResponse } from "@/types";

export default function DashboardPage() {
    const context = useHousehold();
    const householdId = context.status === "ready" ? context.household.id : "";
    const memberId = context.status === "ready" ? context.member.id : "";
    const [expenses, setExpenses] = useState<GetExpenseResponse[]>([]);
    const [balances, setBalances] = useState<BalanceEntry[]>([]);
    const [balanceReady, setBalanceReady] = useState(false);
    const [expensesReady, setExpensesReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

    const loadDashboard = useCallback(async (signal?: AbortSignal) => {
        if (!householdId) return;
        setLoading(true);
        setError("");

        const [expenseResult, balanceResult] = await Promise.all([
            getExpenses(householdId), getBalances(householdId),
        ]);
        if (signal?.aborted) return;

        setExpensesReady(expenseResult.success);
        setBalanceReady(balanceResult.success);
        if (expenseResult.success) setExpenses(expenseResult.data);
        if (balanceResult.success) setBalances(balanceResult.data);
        if (!expenseResult.success || !balanceResult.success) {
            setError("Some dashboard information couldn’t be loaded.");
        }
        setLoading(false);
    }, [householdId]);

    useEffect(() => {
        const controller = new AbortController();
        void loadDashboard(controller.signal);
        return () => controller.abort();
    }, [loadDashboard]);

    const owe = balances.reduce((total, entry) => total + (entry.from === memberId ? toCents(entry.amount) : 0), 0);
    const owed = balances.reduce((total, entry) => total + (entry.to === memberId ? toCents(entry.amount) : 0), 0);
    const balance = owed - owe;
    const balanceValue = (cents: number) => balanceReady ? formatCurrency(cents / 100) : "—";

    const expenseRows = expenses.map((expense) => ({
        id: expense.id,
        description: expense.expense_name,
        paidBy: expense.expense_payer ? `${expense.expense_payer.first_name} ${expense.expense_payer.last_name}` : "Former member",
        date: formatDate(expense.expense_date),
        total: formatCurrency(Number(expense.amount)),
    }));

    return (
        <DashboardLayout>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Overview</h1>
                    {context.status === "ready" && <p>{context.household.name}</p>}
                </div>
                {context.status === "ready" && (
                    <div className="page-features">
                        <Link className="settle-up-btn" href="/settlements">Settle up</Link>
                        <button className="add-expense-btn" onClick={() => setShowCreateModal(true)}>
                            <Plus size={18} aria-hidden="true" /> Add expense
                        </button>
                    </div>
                )}
            </header>
            {context.status !== "ready" ? <HouseholdState status={context.status} /> : (
                <>
                    {error && <div className="page-alert" role="alert">
                        {error} <button onClick={() => void loadDashboard()}>Try again</button>
                    </div>}
                    {loading && !expensesReady && !balanceReady ? (
                        <div className="page-skeleton" role="status">Loading financial overview…</div>
                    ) : (
                        <>
                            <div className="stat-cards-row">
                                <StatCard label="Net balance" value={balanceValue(balance)} />
                                <StatCard label="You owe" value={balanceValue(owe)} variant="pay" />
                                <StatCard label="You’re owed" value={balanceValue(owed)} variant="receive" />
                            </div>
                            {expensesReady && (
                                <div className="overview-grid">
                                    <RecentExpensesCard rows={expenseRows} showStatus={false} />
                                    <SpendingChart expenses={expenses} />
                                </div>
                            )}
                        </>
                    )}
                    {showCreateModal && (
                        <CreateExpenseModal isOpen onClose={() => setShowCreateModal(false)}
                            onSuccess={() => void loadDashboard()} curUserID={memberId} curHouseholdID={householdId} />
                    )}
                </>
            )}
        </DashboardLayout>
    );
}
