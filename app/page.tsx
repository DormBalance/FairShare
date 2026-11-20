import Link from "next/link";
import { Home, Receipt, RefreshCcw, Handshake } from "lucide-react";
import "./landing.css";

const features = [
    { title: "Split expenses", description: "Keep track of rent, groceries, and everything in between.", Icon: Receipt },
    { title: "Track recurring bills", description: "See what’s coming up for your household.", Icon: RefreshCcw },
    { title: "Settle up", description: "See who owes whom and record payments in one place.", Icon: Handshake },
];

export default function LandingPage() {
    return (
        <div className="landing-page">
            <header className="landing-nav">
                <Link href="/" className="brand"><span className="brand-icon"><Home size={20} /></span>FairShare</Link>
                <Link href="/auth/login" className="settle-up-btn">Sign in</Link>
            </header>
            <main className="landing-content">
                <div className="landing-hero">
                    <div className="landing-copy">
                        <h1>Shared expenses,<br /><em>made simple.</em></h1>
                        <p>Split bills with your roommates, see where you stand, and settle up when you’re ready.</p>
                        <Link href="/auth/login?signup=true" className="add-expense-btn">Get started</Link>
                    </div>
                    <aside className="landing-example hover-lift" aria-label="Example household expense">
                        <span className="example-icon"><Home size={24} /></span>
                        <p className="example-label">Example split</p>
                        <h2>Monthly internet</h2>
                        <div className="example-total">$60.00</div>
                        <div className="example-people">
                            <span>You <strong>$20.00</strong></span>
                            <span>Alex <strong>$20.00</strong></span>
                            <span>Sam <strong>$20.00</strong></span>
                        </div>
                    </aside>
                </div>
                <div className="landing-features">
                    {features.map(({ title, description, Icon }) => (
                        <section className="hover-lift" key={title}>
                            <span className="stat-icon"><Icon size={20} /></span>
                            <h2>{title}</h2>
                            <p>{description}</p>
                        </section>
                    ))}
                </div>
            </main>
        </div>
    );
}
