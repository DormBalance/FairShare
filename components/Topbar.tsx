'use client';
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Home } from "lucide-react";
import { useAuth } from "@/app/auth/auth";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Member = { id: string; first_name: string; last_name: string; email: string; role: string };

export default function Topbar(){
    const { user, session } = useAuth();
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownView, setDropdownView] = useState<"main" | "invite" | "remove">("main");
    const [isAdmin, setIsAdmin] = useState(false);
    const [householdId, setHouseholdId] = useState("");
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [inviteEmail, setInviteEmail] = useState("");
    const [feedback, setFeedback] = useState("");
    const [pending, setPending] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
                setDropdownView("main");
                setSelectedMember(null);
                setInviteEmail("");
                setFeedback("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!session?.access_token) return;
        async function loadHousehold() {
            const res = await fetch("/api/households", {
                headers: { "Authorization": `Bearer ${session.access_token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.length === 0) return;
            const household = data[0];
            setHouseholdId(String(household.id));

            const membersRes = await fetch(`/api/households/${household.id}/members`, {
                headers: { "Authorization": `Bearer ${session.access_token}` },
            });
            if (!membersRes.ok) return;
            const memberList: Member[] = await membersRes.json();
            setMembers(memberList);

            const meByEmail = memberList.find((m) => m.email === user?.email);
            setIsAdmin(meByEmail?.role === "Admin");
        }
        void loadHousehold().catch(() => setIsAdmin(false));
    }, [session, user?.email]);

    const firstName = user?.user_metadata?.first_name ?? "";
    const lastName = user?.user_metadata?.last_name ?? "";
    const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : (user?.email?.[0] ?? "F").toUpperCase();
    const displayName = firstName && lastName ? `${firstName} ${lastName[0]}.` : user?.email ?? "Account";

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/");
    }

    async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (pending || !householdId) return;
        setPending(true);
        setFeedback("");

        try {
            const response = await fetch(`/api/households/${householdId}/send-invite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ email: inviteEmail.trim() }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                setFeedback(data?.error ?? "Couldn’t send the invitation.");
                return;
            }
            setFeedback("Invitation sent.");
            setInviteEmail("");
        } catch {
            setFeedback("Couldn’t connect. Please try again.");
        } finally {
            setPending(false);
        }
    }

    async function handleRemove(member: Member) {
        if (pending) return;
        setPending(true);
        setFeedback("");

        try {
            const response = await fetch(`/api/households/${householdId}/members/${member.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                setFeedback(data?.error ?? "Couldn’t remove this household member.");
                return;
            }
            setMembers((previous) => previous.filter((entry) => entry.id !== member.id));
            setSelectedMember(null);
            setFeedback(`${member.first_name} ${member.last_name} was removed.`);
        } catch {
            setFeedback("Couldn’t connect. Please try again.");
        } finally {
            setPending(false);
        }
    }

    const otherMembers = members.filter((m) => m.email !== user?.email);

    return(
        <header className = "topbar">

            <Link href="/dashboard" className="brand">
                <span className="brand-icon"><Home size={20} aria-hidden="true" /></span>
                FairShare
            </Link>

            {user && <div className="topbar-right">
                <div className="topbar-profile-wrapper" ref={dropdownRef} onKeyDown={(event) => {
                    if (event.key === "Escape" && !pending) {
                        setDropdownOpen(false);
                        dropdownRef.current?.querySelector("button")?.focus();
                    }
                }}>
                    <button type="button" className="topbar-profile" aria-label="Account options" aria-expanded={dropdownOpen} disabled={pending} onClick={() => { setDropdownOpen(!dropdownOpen); setDropdownView("main"); setSelectedMember(null); setInviteEmail(""); setFeedback(""); }}>
                        <span className="topbar-profile-picture">{initials}</span>
                        <span className = "topbar-name">{displayName}</span>
                        <ChevronDown size = {16} />
                    </button>

                    {dropdownOpen && (
                        <div className="topbar-dropdown">
                            {dropdownView === "main" && (
                                <>
                                    {isAdmin && (
                                        <>
                                            <button className="topbar-dropdown-item topbar-dropdown-item-neutral" onClick={() => setDropdownView("invite")}>
                                                Invite a member
                                            </button>
                                            <button className="topbar-dropdown-item topbar-dropdown-item-neutral" onClick={() => setDropdownView("remove")}>
                                                Remove a member
                                            </button>
                                        </>
                                    )}
                                    <button className="topbar-dropdown-item" onClick={handleLogout}>
                                        Log Out
                                    </button>
                                </>
                            )}

                            {dropdownView === "invite" && (
                                <form className="topbar-dropdown-panel" onSubmit={handleInvite}>
                                    <button type="button" className="topbar-dropdown-back" disabled={pending} onClick={() => { setDropdownView("main"); setFeedback(""); }}>Back</button>
                                    <input
                                        className="topbar-dropdown-input"
                                        type="email"
                                        placeholder="Email address"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        aria-label="Email address"
                                        required
                                        disabled={pending}
                                    />
                                    <button className="topbar-dropdown-item topbar-dropdown-item-neutral" disabled={pending}>
                                        {pending ? "Sending…" : "Send invitation"}
                                    </button>
                                    </form>
                            )}

                            {dropdownView === "remove" && (
                                <div className="topbar-dropdown-panel">
                                    <button type="button" className="topbar-dropdown-back" disabled={pending} onClick={() => { setDropdownView("main"); setSelectedMember(null); setFeedback(""); }}>Back</button>
                                    {otherMembers.length === 0 && (
                                        <span className="topbar-feedback">No other members</span>
                                    )}
                                    {otherMembers.map((m) => (
                                        <div key={m.id}>
                                            <button
                                                className="topbar-dropdown-item topbar-dropdown-item-neutral"
                                                disabled={pending}
                                                onClick={() => {
                                                    setFeedback("");
                                                    setSelectedMember(selectedMember?.id === m.id ? null : m);
                                                }}
                                            >
                                                {m.first_name} {m.last_name}
                                            </button>
                                            {selectedMember?.id === m.id && (
                                                <button className="topbar-dropdown-item" disabled={pending} onClick={() => handleRemove(m)}>
                                                    {pending ? "Removing…" : "Confirm removal"}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {feedback && <p className="topbar-feedback" role="status">{feedback}</p>}
                        </div>
                    )}
                </div>
            </div>}
        </header>
    )
}
