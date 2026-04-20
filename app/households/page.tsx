'use client';
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth/auth";
import "./households.css";

const CODE_LENGTH = 8;

export default function HouseholdsPage() {
    const { session } = useAuth();
    const router = useRouter();

    const [isCreate, setIsCreate] = useState(false);
    const [codeChars, setCodeChars] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const [householdName, setHouseholdName] = useState("");
    const [description, setDescription] = useState("");
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

    async function handleJoin(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const inviteCode = codeChars.join("");

        const res = await fetch("/api/households/join", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ invite_code: inviteCode }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error ?? "Something went wrong");
            setLoading(false);
            return;
        }

        router.push("/dashboard");
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const res = await fetch("/api/households", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ name: householdName, description }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error ?? "Something went wrong");
            setLoading(false);
            return;
        }

        router.push("/dashboard");
    }

    function switchMode() {
        setIsCreate(!isCreate);
        setError("");
        setCodeChars(Array(CODE_LENGTH).fill(""));
        setHouseholdName("");
        setDescription("");
    }

    return (
        <div className="households-page">
            <div className="households-card">
                <div className="households-header">
                    <h1 className="households-title">FairShare</h1>
                    <p className="households-subtitle">
                        {isCreate ? "Create a new household" : "Join an existing household"}
                    </p>
                </div>

                {isCreate ? (
                    <form onSubmit={handleCreate} className="households-form">
                        <div className="households-field">
                            <label className="households-label">Household Name</label>
                            <input
                                className="households-input"
                                type="text"
                                value={householdName}
                                onChange={(e) => setHouseholdName(e.target.value)}
                                placeholder="Campus Circle Building 3 205C"
                                required
                            />
                        </div>

{error && <p className="households-error">{error}</p>}

                        <button className="households-btn" type="submit" disabled={loading}>
                            {loading ? "Please wait..." : "Create Household"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleJoin} className="households-form">
                        <div className="households-field">
                            <label className="households-label">Invite Code</label>
                            <div className="code-inputs">
                                {codeChars.map((char, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { inputRefs.current[i] = el; }}
                                        className="code-input"
                                        type="text"
                                        inputMode="text"
                                        maxLength={2}
                                        value={char}
                                        onChange={(e) => handleCodeChange(i, e.target.value)}
                                        onKeyDown={(e) => handleCodeKeyDown(i, e)}
                                        onPaste={handleCodePaste}
                                        required={i === 0}
                                    />
                                ))}
                            </div>
                        </div>

                        {error && <p className="households-error">{error}</p>}

                        <button
                            className="households-btn"
                            type="submit"
                            disabled={loading || codeChars.join("").length < CODE_LENGTH}
                        >
                            {loading ? "Please wait..." : "Join Household"}
                        </button>
                    </form>
                )}

                <p className="households-toggle">
                    {isCreate ? "Have an invite code?" : "Starting a new household?"}
                    <button className="households-toggle-btn" onClick={switchMode}>
                        {isCreate ? "Join instead" : "Create one"}
                    </button>
                </p>
            </div>
        </div>
    );
}
