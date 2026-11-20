import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

type StatCardProps = {
    label: string;
    value: string;
    valueClassName?: string;
    variant?: "net" | "pay" | "receive";
};

const icons = { net: Wallet, pay: ArrowUpRight, receive: ArrowDownLeft };

export default function StatCard({ label, value, valueClassName = "", variant = "net" }: StatCardProps) {
    const Icon = icons[variant];

    return (
        <article className="stat-card hover-lift" data-variant={variant}>
            <span className="stat-icon"><Icon size={19} aria-hidden="true" /></span>
            <p className="stat-card-label">{label}</p>
            <p className={`stat-card-value ${valueClassName}`}>{value}</p>
        </article>
    );
}
