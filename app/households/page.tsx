'use client';
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth/auth";
import { Home } from "lucide-react";
import Link from "next/link";

const CODE_LENGTH = 8;

export default function HouseholdsPage() {
    const { session } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!session?.access_token) return;
        async function checkHousehold() {
            const res = await fetch("/api/households", {
                headers: { "Authorization": `Bearer ${session!.access_token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.length > 0) router.replace("/dashboard");
        }
        void checkHousehold().catch(() => setError("Couldn’t check your household. Please refresh to try again."));
    }, [session, router]);

    const [isCreate, setIsCreate] = useState(false);
    const [codeChars, setCodeChars] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const [householdName, setHouseholdName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    function handleCodeChange(index: number, value: string) {
        const char = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1);
        const updated = [...codeChars];
        updated[index] = char;
        setCodeChars(updated);

        if (char && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    }

    function handleCodeKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Backspace" && !codeChars[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }

    function handleCodePaste(e: React.ClipboardEvent) {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
        const updated = Array(CODE_LENGTH).fill("");
        pasted.split("").forEach((char, i) => { updated[i] = char; });
        setCodeChars(updated);
        inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
    }

    async function submitHousehold(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loading || !session?.access_token) return;

        const name = householdName.trim();
        const inviteCode = codeChars.join("");
        if (isCreate ? !name : inviteCode.length !== CODE_LENGTH) {
            setError(isCreate ? "Enter a household name." : "Enter all eight characters of the invite code.");
            return;
        }

        setError("");
        setLoading(true);
        try {
            const response = await fetch(isCreate ? "/api/households" : "/api/households/join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(isCreate ? { name } : { invite_code: inviteCode }),
            });
            if (!response.ok) {
                const result = await response.json().catch(() => null);
                setError(result?.error ?? "Couldn’t set up this household. Please try again.");
                return;
            }
            router.replace("/dashboard");
        } catch {
            setError("Couldn’t connect. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    function switchMode() {
        setIsCreate(!isCreate);
        setError("");
        setCodeChars(Array(CODE_LENGTH).fill(""));
        setHouseholdName("");
    }

    return (
        <main className="account-page">
            <div className="account-card hover-lift">
                <div className="account-header">
                    <Link href="/" className="brand" aria-label="FairShare home"><span className="brand-icon"><Home size={20} aria-hidden="true" /></span></Link>
                    <h1>{isCreate ? "Create a household" : "Join your household"}</h1>
                    <p>
                        {isCreate ? "Choose a name your roommates will recognize." : "Enter the eight-character code from your roommate."}
                    </p>
                </div>

                {isCreate ? (
                    <form onSubmit={submitHousehold} className="account-form">
                        <div className="account-field">
                            <label htmlFor="household-name">Household Name</label>
                            <input id="household-name"

                                type="text"
                                value={householdName}
                                onChange={(e) => setHouseholdName(e.target.value)}
                                placeholder="Campus Circle Building 3 205C"
                                required
                            />
                        </div>

                        {error && <p className="page-alert" role="alert">{error}</p>}

                        <button className="add-expense-btn account-submit" type="submit" disabled={loading || !session}>
                            {loading ? "Please wait..." : "Create Household"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={submitHousehold} className="account-form">
                        <div className="account-field">
                            <span id="invite-code-label">Invite code</span>
                            <div className="code-inputs" role="group" aria-labelledby="invite-code-label">
                                {codeChars.map((char, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { inputRefs.current[i] = el; }}
                                        className="code-input"
                                        aria-label={`Character ${i + 1}`}
                                        type="text"
                                        inputMode="text"
                                        maxLength={2}
                                        value={char}
                                        onChange={(e) => handleCodeChange(i, e.target.value)}
                                        onKeyDown={(e) => handleCodeKeyDown(i, e)}
                                        onPaste={handleCodePaste}
                                        required
                                    />
                                ))}
                            </div>
                        </div>

                        {error && <p className="page-alert" role="alert">{error}</p>}

                        <button
                            className="add-expense-btn account-submit"
                            type="submit"
                            disabled={loading || codeChars.join("").length < CODE_LENGTH}
                        >
                            {loading ? "Please wait..." : "Join Household"}
                        </button>
                    </form>
                )}

                <p className="account-toggle">
                    {isCreate ? "Have an invite code?" : "Starting a new household?"}
                    <button onClick={switchMode}>
                        {isCreate ? "Join instead" : "Create one"}
                    </button>
                </p>
            </div>
        </main>
    );
}
