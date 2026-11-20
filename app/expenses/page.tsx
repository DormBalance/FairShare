"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import HouseholdState from "@/components/HouseholdState";
import RecentExpensesCard from "@/components/RecentExpensesCard";
import CreateExpenseModal from "@/components/CreateExpenseModal";
import { getExpenses } from "@/lib/api";
import { formatCurrency, formatDate, toCents } from "@/lib/format";
import { useHousehold } from "@/lib/useHousehold";
import type { GetExpenseResponse } from "@/types";
import "./expenses.css";

function describeSplit(expense: GetExpenseResponse, userId: string) {
    const paid = expense.payer_user_id === userId;
    const cents = expense.splits.reduce((total, split) => {
        if (split.opted_out || (paid ? split.user_id === userId : split.user_id !== userId)) {
            return total;
        }
        return total + toCents(split.amount_to_pay);
    }, 0);

    if (!cents) return "No share due";
    return `${paid ? "You are owed" : "You owe"} ${formatCurrency(cents / 100)}`;
}

export default function ExpensesPage() {
    const context = useHousehold();
    const householdId = context.status === "ready" ? context.household.id : "";
    const memberId = context.status === "ready" ? context.member.id : "";
    const [expenses, setExpenses] = useState<GetExpenseResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [onlyMine, setOnlyMine] = useState(false);
    const [search, setSearch] = useState("");

    const refresh = useCallback(async (signal?: AbortSignal) => {
        if (!householdId) return;
        setLoading(true);
        setError("");
        const result = await getExpenses(householdId);
        if (signal?.aborted) return;
        if (result.success === true) setExpenses(result.data);
        else setError(result.error || "We couldn’t load expenses.");
        setLoading(false);
    }, [householdId]);

    useEffect(() => {
        const controller = new AbortController();
        void refresh(controller.signal);
        return () => controller.abort();
    }, [refresh]);

    const query = search.trim().toLowerCase();
    const rows = expenses
        .filter((expense) => !onlyMine || expense.payer_user_id === memberId ||
            expense.splits.some((split) => split.user_id === memberId && !split.opted_out))
        .map((expense) => ({
            id: expense.id,
            description: expense.expense_name,
            paidBy: expense.expense_payer ? `${expense.expense_payer.first_name} ${expense.expense_payer.last_name}` : "Former member",
            date: formatDate(expense.expense_date),
            total: formatCurrency(Number(expense.amount)),
            status: describeSplit(expense, memberId),
        }))
        .filter((row) => row.description.toLowerCase().includes(query) || row.paidBy.toLowerCase().includes(query));

    return (
        <DashboardLayout>
            <header className="page-header">
                <div><h1 className="page-title">Expenses</h1><p>Review household spending and individual shares.</p></div>
                {context.status === "ready" && <button className="add-expense-btn" onClick={() => setShowModal(true)}>
                    <Plus size={18} aria-hidden="true" /> Add expense
                </button>}
            </header>
            {context.status !== "ready" ? <HouseholdState status={context.status} /> : (
                <>
                    <div className="expense-page-controls">
                        <div className="expense-page-tabs" role="group" aria-label="Filter by participation">
                            <button aria-pressed={!onlyMine} onClick={() => setOnlyMine(false)}>All expenses</button>
                            <button aria-pressed={onlyMine} onClick={() => setOnlyMine(true)}>Your expenses</button>
                        </div>
                        <label className="expense-page-search-bar">
                            <Search size={18} aria-hidden="true" />
                            <span className="sr-only">Search expenses</span>
                            <input type="search" placeholder="Search expenses" value={search}
                                onChange={(event) => setSearch(event.target.value)} />
                        </label>
                    </div>
                    {error ? <div className="page-alert" role="alert">{error} <button onClick={() => void refresh()}>Try again</button></div> : (
                        <RecentExpensesCard rows={rows} maxRows={Infinity} viewAll={false} scrollable loading={loading} />
                    )}
                    {showModal && <CreateExpenseModal isOpen onClose={() => setShowModal(false)}
                        onSuccess={() => void refresh()} curUserID={memberId} curHouseholdID={householdId} />}
                </>
            )}
        </DashboardLayout>
    );
}
