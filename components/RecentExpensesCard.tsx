import Link from "next/link";
import { Receipt } from "lucide-react";

type ExpenseRow = {
    id: string | number;
    description: string;
    paidBy: string;
    date: string;
    total: string;
    status?: string;
};

type RecentExpensesCardProps = {
    rows: ExpenseRow[];
    viewAll?: boolean;
    scrollable?: boolean;
    maxRows?: number;
    showStatus?: boolean;
    loading?: boolean;
};

function statusClass(status: string) {
    if (status.startsWith("You owe")) return "status-owe";
    if (status.includes("owes you") || status.startsWith("You are owed")) return "status-owed";
    return "status-settled";
}

export default function RecentExpensesCard({
    rows, viewAll = true, scrollable = false, maxRows = 5, showStatus = true, loading = false,
}: RecentExpensesCardProps) {
    const visibleRows = rows.slice(0, maxRows);

    return (
        <section className="recent-expenses-card hover-lift" aria-labelledby="recent-expenses-title">
            <div className="recent-expenses-header">
                <h2 id="recent-expenses-title" className="recent-expenses-title">Recent expenses</h2>
                {viewAll && <Link href="/expenses" className="view-all-link">View all</Link>}
            </div>
            {loading ? <div className="page-skeleton" role="status">Loading expenses…</div> : visibleRows.length ? (
                <div className={`table-scroll ${scrollable ? "table-scroll-limited" : ""}`} tabIndex={0}
                    role="region" aria-label="Expense records">
                    <table className="activity-table">
                        <thead><tr>
                            <th scope="col">Expense</th>
                            <th scope="col">Date</th>
                            <th scope="col">Total</th>
                            {showStatus && <th scope="col">Split</th>}
                        </tr></thead>
                        <tbody>
                            {visibleRows.map((row) => (
                                <tr key={row.id}>
                                    <td><div className="expense-identity">
                                        <span className="expense-icon"><Receipt size={17} aria-hidden="true" /></span>
                                        <div><strong>{row.description}</strong><small>Paid by {row.paidBy}</small></div>
                                    </div></td>
                                    <td>{row.date}</td>
                                    <td className="table-amount">{row.total}</td>
                                    {showStatus && <td>
                                        {row.status && <span className={statusClass(row.status)}>{row.status}</span>}
                                    </td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <span className="stat-icon"><Receipt size={21} aria-hidden="true" /></span>
                    <p>No expenses to show.</p>
                </div>
            )}
        </section>
    );
}
