type StatCardProps = {
    label: string;
    value: string;
    valueClassName?: string;
}
//generated with copilot, just changed to p and h2
export default function StatCard({
    label, value, valueClassName = "",
}: StatCardProps) {
    return(
        <div className="stat-card">
            <p className="stat-card-label">{label}</p>
            <h2 className={`stat-card-value ${valueClassName}`}>{value}</h2>
        </div>
    )
}