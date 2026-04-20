import Link from "next/link";
import { Home } from "lucide-react";
import "./landing.css";

export default function LandingPage() {
    return (
        <div className="landing-page">
            <div className="landing-content">
                <div className="landing-logo">
                    <Home size={144} strokeWidth={1.5} />
                </div>
                <h1 className="landing-title">FairShare</h1>
                <p className="landing-subtitle">Split expenses fairly with your roommates</p>
                <Link href="/auth/login?signup=true" className="landing-btn">
                    Get Started
                </Link>
            </div>
        </div>
    );
}
