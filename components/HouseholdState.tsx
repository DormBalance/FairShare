import Link from "next/link";
import { Home } from "lucide-react";

export default function HouseholdState({ status }: { status: "loading" | "empty" | "error" }) {
    if (status === "loading") return <div className="page-skeleton" role="status">Loading household…</div>;

    if (status === "error") {
        return <p className="page-alert" role="alert">We couldn’t load your household. Refresh the page to try again.</p>;
    }

    return (
        <section className="empty-state">
            <span className="stat-icon"><Home size={22} /></span>
            <h2>Set up your household</h2>
            <p>Create a household or join your roommates with an invite code.</p>
            <Link className="add-expense-btn" href="/households">Create or join a household</Link>
        </section>
    );
}
