"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCcw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import HouseholdState from "@/components/HouseholdState";
import CreateExpenseModal from "@/components/CreateExpenseModal";
import { getRecurringExpenses } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/format";
import { useHousehold } from "@/lib/useHousehold";
import type { GetRecurringExpenseResponse } from "@/types";

export default function RecurringPage() {
    const context = useHousehold();
    const householdId = context.status === "ready" ? context.household.id : "";
    const memberId = context.status === "ready" ? context.member.id : "";
    const [bills, setBills] = useState<GetRecurringExpenseResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);

    const refresh = useCallback(async (signal?: AbortSignal) => {
        if (!householdId) return;
        setLoading(true);
        setError("");
        const result = await getRecurringExpenses(householdId);
        if (signal?.aborted) return;
        if (result.success === false) setError(result.error || "We couldn’t load recurring bills.");
        else setBills(result.data);
        setLoading(false);
    }, [householdId]);

    useEffect(() => {
        const controller = new AbortController();
        void refresh(controller.signal);
        return () => controller.abort();
    }, [refresh]);

    return (
        <DashboardLayout>
            <header className="page-header">
                <div><h1 className="page-title">Recurring bills</h1><p>Keep track of regular household costs and due dates.</p></div>
                {context.status === "ready" && <button className="add-expense-btn" onClick={() => setShowModal(true)}>
                    <Plus size={18} aria-hidden="true" /> Add recurring bill
                </button>}
            </header>
            {context.status !== "ready" ? <HouseholdState status={context.status} /> : (
                <>
                    {loading ? <div className="page-skeleton" role="status">Loading recurring bills…</div> : error ? (
                        <div className="page-alert" role="alert">{error} <button onClick={() => void refresh()}>Try again</button></div>
                    ) : (
                        <section className="recent-expenses-card hover-lift">
                            <div className="recent-expenses-header"><h2 className="recent-expenses-title">Bill schedule</h2></div>
                            {bills.length === 0 ? (
                                <div className="empty-state">
                                    <span className="stat-icon"><RefreshCcw size={20} aria-hidden="true" /></span>
                                    <p>No recurring bills yet.</p>
                                </div>
                            ) : (
                                <div className="table-scroll" role="region" aria-label="Bill schedule" tabIndex={0}>
                                    <table className="activity-table">
                                        <thead><tr>
                                            <th scope="col">Bill</th><th scope="col">Amount</th><th scope="col">Frequency</th>
                                            <th scope="col">Next due</th><th scope="col">Status</th>
                                        </tr></thead>
                                        <tbody>{bills.map((bill) => (
                                            <tr key={bill.id}>
                                                <td><div className="expense-identity">
                                                    <span className="expense-icon"><RefreshCcw size={17} aria-hidden="true" /></span>
                                                    <div><strong>{bill.expense_name}</strong>
                                                        <small>Paid by {bill.recurring_expense_payer
                                                            ? `${bill.recurring_expense_payer.first_name} ${bill.recurring_expense_payer.last_name}`
                                                            : "Former member"}</small>
                                                    </div>
                                                </div></td>
                                                <td className="table-amount">{formatCurrency(Number(bill.amount))}</td>
                                                <td>{bill.frequency}</td>
                                                <td>{formatDate(bill.next_expense_date)}</td>
                                                <td><span className={bill.is_active ? "status-owed" : "status-settled"}>
                                                    {bill.is_active ? "Active" : "Inactive"}
                                                </span></td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    )}
                    {showModal && <CreateExpenseModal isOpen recurringOnly onClose={() => setShowModal(false)}
                        onSuccess={() => void refresh()} curUserID={memberId} curHouseholdID={householdId} />}
                </>
            )}
        </DashboardLayout>
    );
}
