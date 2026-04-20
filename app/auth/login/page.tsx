'use client';
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/auth/auth";
import { supabase } from "@/lib/supabaseClient";
import "./login.css";

async function getHouseholds(token: string) {
    const res = await fetch("/api/households", {
        headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return await res.json();
}

async function createProfile(token: string, firstName: string, lastName: string) {
    await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
    });
}

export default function LoginPage() {
    const { signIn, signUp } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isSignUp, setIsSignUp] = useState(searchParams.get("signup") === "true");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        await supabase.auth.signOut();

        const result = isSignUp
            ? await signUp(email, password)
            : await signIn(email, password);

        if (result.error) {
            setError(result.error);
            setLoading(false);
            return;
        }

        const { data: { session: freshSession } } = await supabase.auth.getSession();
        const token = freshSession?.access_token ?? "";

        if (isSignUp) {
            await createProfile(token, firstName, lastName);
            await supabase.auth.updateUser({ data: { first_name: firstName, last_name: lastName } });
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            const fn = user?.user_metadata?.first_name ?? "";
            const ln = user?.user_metadata?.last_name ?? "";
            if (fn && ln) await createProfile(token, fn, ln);
        }

        const households = await getHouseholds(token);

        if (households.length === 0) {
            router.push("/households");
        } else {
            router.push("/dashboard");
        }
    }

    function switchMode() {
        setIsSignUp(!isSignUp);
        setError("");
        setFirstName("");
        setLastName("");
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-title">FairShare</h1>
                    <p className="login-subtitle">{isSignUp ? "Create your account" : "Sign in to your account"}</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {isSignUp && (
                        <div className="login-name-row">
                            <div className="login-field">
                                <label className="login-label">First Name</label>
                                <input
                                    className="login-input"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Bob"
                                    required
                                />
                            </div>
                            <div className="login-field">
                                <label className="login-label">Last Name</label>
                                <input
                                    className="login-input"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Smith"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="login-field">
                        <label className="login-label">Email</label>
                        <input
                            className="login-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="login-field">
                        <label className="login-label">Password</label>
                        <input
                            className="login-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p className="login-error">{error}</p>}

                    <button className="login-btn" type="submit" disabled={loading}>
                        {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
                    </button>
                </form>

                <p className="login-toggle">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}
                    <button className="login-toggle-btn" onClick={switchMode}>
                        {isSignUp ? "Sign in" : "Sign up"}
                    </button>
                </p>
            </div>
        </div>
    );
}
