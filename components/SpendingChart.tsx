import { useState } from "react";
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import type { GetExpenseResponse } from "@/types";
import { formatCurrency, toCents } from "@/lib/format";

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

export default function SpendingChart({ expenses }: { expenses: GetExpenseResponse[] }) {
    const [selectedKey, setSelectedKey] = useState("");
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
        return { key: date.toISOString().slice(0, 7), label: monthFormatter.format(date), cents: 0 };
    });
    const monthsByKey = new Map(months.map((month) => [month.key, month]));

    for (const expense of expenses) {
        const month = monthsByKey.get(expense.expense_date.slice(0, 7));
        if (month) month.cents += toCents(expense.amount);
    }

    const selected = monthsByKey.get(selectedKey);
    const peak = Math.max(1, ...months.map((month) => month.cents));
    const total = months.reduce((sum, month) => sum + month.cents, 0);

    return (
        <section className="spending-card hover-lift">
            <div className="spending-heading">
                <div>
                    <h2>Household spending</h2>
                    <p>Last 6 months</p>
                </div>
                <span className="stat-icon"><ChartNoAxesColumnIncreasing size={20} aria-hidden="true" /></span>
            </div>
            <div className="spending-amount" aria-live="polite">
                <strong className="spending-total">{formatCurrency((selected?.cents ?? total) / 100)}</strong>
                <span>{selected ? selected.label : "Six-month total"}</span>
            </div>
            <ul className="spending-chart">
                {months.map((month) => (
                    <li key={month.key}>
                        <button type="button" className="chart-month" aria-pressed={selectedKey === month.key}
                            aria-label={`${month.label}, ${formatCurrency(month.cents / 100)}`}
                            onClick={() => setSelectedKey((previous) => previous === month.key ? "" : month.key)}>
                            <span className="chart-track" aria-hidden="true">
                                <span className="chart-bar" style={{ height: `${month.cents / peak * 100}%` }} />
                            </span>
                            <span aria-hidden="true">{month.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
