'use client';
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/auth/auth";
import { supabase } from "@/lib/supabaseClient";
import { Home } from "lucide-react";
import Link from "next/link";

async function getHouseholds(token: string) {
    const res = await fetch("/api/households", {
        headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Couldn’t load your households. Please try again.");
    return await res.json();
}

async function createProfile(token: string, firstName: string, lastName: string) {
    const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
    });
    if (!response.ok) throw new Error("Couldn’t save your profile. Please try again.");
}

function LoginForm() {
    const { signIn, signUp } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isSignUp, setIsSignUp] = useState(searchParams.get("signup") === "true");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (loading) return;
        if (isSignUp && (!firstName.trim() || !lastName.trim())) {
            setError("Enter your first and last name.");
            return;
        }
        setError("");
        setNotice("");
        setLoading(true);

        try {
            const result = isSignUp
                ? await signUp(email, password, { first_name: firstName.trim(), last_name: lastName.trim() })
                : await signIn(email, password);
            if (result.error) {
                setError(result.error);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                if (!isSignUp) throw new Error("Couldn’t start your session. Please try again.");
                setIsSignUp(false);
                setPassword("");
                setNotice("Check your email to confirm your account, then sign in.");
                return;
            }

            const metadata = session.user.user_metadata;
            if (metadata.first_name && metadata.last_name) {
                await createProfile(session.access_token, metadata.first_name, metadata.last_name);
            }

            const households = await getHouseholds(session.access_token);
            router.replace(households.length ? "/dashboard" : "/households");
        } catch (error) {
            setError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    function switchMode() {
        setIsSignUp(!isSignUp);
        setError("");
        setNotice("");
        setFirstName("");
        setLastName("");
    }

    return (
        <main className="account-page">
            <div className="account-card hover-lift">
                <div className="account-header">
                    <Link href="/" className="brand" aria-label="FairShare home"><span className="brand-icon"><Home size={20} aria-hidden="true" /></span></Link>
                    <h1>{isSignUp ? "Create your account" : "Welcome back"}</h1>
                    <p>{isSignUp ? "Start tracking shared expenses with your roommates." : "Sign in to your FairShare account."}</p>
                </div>

                <form onSubmit={handleSubmit} className="account-form">
                    {isSignUp && (
                        <div className="account-name-row">
                            <div className="account-field">
                                <label htmlFor="first-name">First Name</label>
                                <input id="first-name" autoComplete="given-name"

                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Bob"
                                    required
                                />
                            </div>
                            <div className="account-field">
                                <label htmlFor="last-name">Last Name</label>
                                <input id="last-name" autoComplete="family-name"

                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Smith"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="account-field">
                        <label htmlFor="email">Email</label>
                        <input id="email" autoComplete="email"

                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="account-field">
                        <label htmlFor="password">Password</label>
                        <input id="password" autoComplete={isSignUp ? "new-password" : "current-password"}

                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p className="page-alert" role="alert">{error}</p>}
                    {notice && <p className="account-notice" role="status">{notice}</p>}

                    <button className="add-expense-btn account-submit" type="submit" disabled={loading}>
                        {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
                    </button>
                </form>

                <p className="account-toggle">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}
                    <button onClick={switchMode}>
                        {isSignUp ? "Sign in" : "Sign up"}
                    </button>
                </p>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
