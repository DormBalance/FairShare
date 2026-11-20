"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import HouseholdState from "@/components/HouseholdState";
import StatCard from "@/components/StatCard";
import CreateSettlementModal from "@/components/CreateSettlementModal";
import { getBalances, getSettlements } from "@/lib/api";
import { formatCurrency, formatDate, toCents } from "@/lib/format";
import { useHousehold } from "@/lib/useHousehold";
import type { BalanceEntry, GetSettlementResponse } from "@/types";
import "./settlements.css";

export default function SettlementsPage() {
    const context = useHousehold();
    const householdId = context.status === "ready" ? context.household.id : "";
    const memberId = context.status === "ready" ? context.member.id : "";
    const [balances, setBalances] = useState<BalanceEntry[]>([]);
    const [settlements, setSettlements] = useState<GetSettlementResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);

    const refresh = useCallback(async (signal?: AbortSignal) => {
        if (!householdId) return;
        setLoading(true);
        setError("");
        const [balanceResult, historyResult] = await Promise.all([
            getBalances(householdId), getSettlements(householdId),
        ]);
        if (signal?.aborted) return;
        if (balanceResult.success && historyResult.success) {
            setBalances(balanceResult.data);
            setSettlements(historyResult.data);
        } else {
            setError("We couldn’t load settlements and balances.");
        }
        setLoading(false);
    }, [householdId]);

    useEffect(() => {
        const controller = new AbortController();
        void refresh(controller.signal);
        return () => controller.abort();
    }, [refresh]);

    const outgoing = balances.filter((balance) => balance.from === memberId);
    const incoming = balances.filter((balance) => balance.to === memberId);
    const totalOwe = outgoing.reduce((sum, item) => sum + toCents(item.amount), 0);
    const totalOwed = incoming.reduce((sum, item) => sum + toCents(item.amount), 0);
    const names = new Map(context.status === "ready" ? context.members.map((member) =>
        [member.id, `${member.first_name} ${member.last_name}`]) : []);
    const balanceGroups = [
        { title: "Who you owe", entries: outgoing, peer: "to" as const, tone: "status-owe" },
        { title: "Who owes you", entries: incoming, peer: "from" as const, tone: "status-owed" },
    ];

    return (
        <DashboardLayout>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Settlements</h1>
                    <p>Track outstanding balances and payments.</p>
                </div>
                {context.status === "ready" && <button className="add-expense-btn" onClick={() => setShowModal(true)}>
                    <Plus size={18} aria-hidden="true" /> Record payment
                </button>}
            </header>
            {context.status !== "ready" ? <HouseholdState status={context.status} /> : (
                <>
                    {loading ? <div className="page-skeleton" role="status">Loading settlements…</div> : error ? (
                        <div className="page-alert" role="alert">{error} <button onClick={() => void refresh()}>Try again</button></div>
                    ) : (
                        <>
                            <div className="stat-cards-row">
                                <StatCard label="Net balance" value={formatCurrency((totalOwed - totalOwe) / 100)} />
                                <StatCard label="You owe" value={formatCurrency(totalOwe / 100)} variant="pay" />
                                <StatCard label="You’re owed" value={formatCurrency(totalOwed / 100)} variant="receive" />
                            </div>
                            <div className="settlement-info-cols">
                                {balanceGroups.map(({ title, entries, peer, tone }) => (
                                    <section className="settlement-cards hover-lift" key={title}>
                                        <h2>{title}</h2>
                                        {entries.length === 0 ? <p>No outstanding balances.</p> : (
                                            <ul>
                                                {entries.map((entry) => (
                                                    <li key={entry[peer]}>
                                                        <span>{names.get(entry[peer]) ?? "Former member"}</span>
                                                        <strong className={tone}>{formatCurrency(Number(entry.amount))}</strong>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </section>
                                ))}
                            </div>
                            <section className="settlement-history-card hover-lift">
                                <div className="recent-expenses-header"><h2 className="recent-expenses-title">Payment history</h2></div>
                                {settlements.length === 0 ? <div className="empty-state"><p>No payments recorded.</p></div> : (
                                    <div className="table-scroll" role="region" aria-label="Payment history" tabIndex={0}>
                                        <table className="activity-table">
                                            <thead><tr>
                                                <th scope="col">Date</th><th scope="col">Paid by</th><th scope="col">Paid to</th>
                                                <th scope="col">Amount</th><th scope="col">Method</th>
                                            </tr></thead>
                                            <tbody>{settlements.map((payment) => (
                                                <tr key={payment.id}>
                                                    <td>{formatDate(payment.payment_date)}</td>
                                                    <td>{payment.settlement_payer.first_name} {payment.settlement_payer.last_name}</td>
                                                    <td>{payment.settlement_recipient.first_name} {payment.settlement_recipient.last_name}</td>
                                                    <td className="table-amount">{formatCurrency(Number(payment.amount))}</td>
                                                    <td>{payment.payment_method}</td>
                                                </tr>
                                            ))}</tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                    <CreateSettlementModal isOpen={showModal} onClose={() => setShowModal(false)}
                        onSuccess={() => void refresh()} curUserID={memberId} curHouseholdID={householdId}
                        householdMembers={context.members} />
                </>
            )}
        </DashboardLayout>
    );
}
