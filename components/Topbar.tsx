'use client';
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Bell, Search, Home } from "lucide-react";
import { useAuth } from "@/app/auth/auth";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Member = { id: string; first_name: string; last_name: string; role: string };

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
    const [inviteStatus, setInviteStatus] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
                setDropdownView("main");
                setSelectedMember(null);
                setInviteEmail("");
                setInviteStatus("");
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

            const me = memberList.find((m) => m.id === String(user?.id) || true);
            const meByEmail = memberList.find((m: any) => m.email === user?.email);
            if (meByEmail?.role === "Admin") setIsAdmin(true);
        }
        loadHousehold();
    }, [session]);

    if (!user) return null;

    const firstName = user.user_metadata?.first_name ?? "";
    const lastName = user.user_metadata?.last_name ?? "";
    const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : user.email[0].toUpperCase();
    const displayName = firstName && lastName ? `${firstName} ${lastName[0]}.` : user.email;

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/");
    }

    async function handleInvite() {
        if (!inviteEmail || !householdId) return;
        setInviteStatus("Sending...");
        const res = await fetch(`/api/households/${householdId}/send-invite`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ email: inviteEmail }),
        });
        if (res.ok) {
            setInviteStatus("Invite sent!");
            setInviteEmail("");
        } else {
            const data = await res.json();
            setInviteStatus(data.error ?? "Failed to send");
        }
    }

    async function handleRemove(member: Member) {
        const res = await fetch(`/api/households/${householdId}/members/${member.id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${session?.access_token}` },
        });
        if (res.ok) {
            setMembers((prev) => prev.filter((m) => m.id !== member.id));
            setSelectedMember(null);
            setDropdownView("main");
            setDropdownOpen(false);
        }
    }

    const otherMembers = members.filter((m: any) => m.email !== user.email);

    return(
        <header className = "topbar">

            <div className = "topbar-left" onClick={handleLogout} style={{ cursor: "pointer" }}>
                <Home size = {30} />
                <span className = "fairshare-title">FairShare</span>
            </div>

            <div className = "topbar-right">
                <button className = "icon-button" aria-label="Search">
                    <Search size = {20} />
                </button>

                <button className = "icon-button" aria-label="Notifications">
                    <Bell size = {20} />
                </button>

                <div className="topbar-profile-wrapper" ref={dropdownRef}>
                    <div className="topbar-profile" onClick={() => { setDropdownOpen(!dropdownOpen); setDropdownView("main"); setSelectedMember(null); setInviteEmail(""); setInviteStatus(""); }} style={{ cursor: "pointer" }}>
                        <div className = "topbar-profile-picture">{initials}</div>
                        <span className = "topbar-name">{displayName}</span>
                        <ChevronDown size = {16} />
                    </div>

                    {dropdownOpen && (
                        <div className="topbar-dropdown">
                            {dropdownView === "main" && (
                                <>
                                    {isAdmin && (
                                        <>
                                            <button className="topbar-dropdown-item topbar-dropdown-item-neutral" onClick={() => setDropdownView("invite")}>
                                                Invite
                                            </button>
                                            <button className="topbar-dropdown-item topbar-dropdown-item-neutral" onClick={() => setDropdownView("remove")}>
                                                Remove
                                            </button>
                                        </>
                                    )}
                                    <button className="topbar-dropdown-item" onClick={handleLogout}>
                                        Log Out
                                    </button>
                                </>
                            )}

                            {dropdownView === "invite" && (
                                <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                                    <button className="topbar-dropdown-back" onClick={() => { setDropdownView("main"); setInviteStatus(""); }}>← Back</button>
                                    <input
                                        className="topbar-dropdown-input"
                                        type="email"
                                        placeholder="Email address"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                                    />
                                    <button className="topbar-dropdown-item topbar-dropdown-item-neutral" onClick={handleInvite}>
                                        Send Invite
                                    </button>
                                    {inviteStatus && <span style={{ fontSize: 11, color: "#666", textAlign: "center" }}>{inviteStatus}</span>}
                                </div>
                            )}

                            {dropdownView === "remove" && (
                                <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
                                    <button className="topbar-dropdown-back" onClick={() => { setDropdownView("main"); setSelectedMember(null); }}>← Back</button>
                                    {otherMembers.length === 0 && (
                                        <span style={{ fontSize: 12, color: "#888", padding: "4px 0" }}>No other members</span>
                                    )}
                                    {otherMembers.map((m) => (
                                        <div key={m.id}>
                                            <button
                                                className="topbar-dropdown-item topbar-dropdown-item-neutral"
                                                onClick={() => setSelectedMember(selectedMember?.id === m.id ? null : m)}
                                            >
                                                {m.first_name} {m.last_name}
                                            </button>
                                            {selectedMember?.id === m.id && (
                                                <button className="topbar-dropdown-item" onClick={() => handleRemove(m)}>
                                                    Confirm Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
