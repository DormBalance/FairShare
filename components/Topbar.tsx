'use client';
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Bell, Search, Home } from "lucide-react";
import { useAuth } from "@/app/auth/auth";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Topbar(){
    const { user } = useAuth();
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) return null;

    const firstName = user.user_metadata?.first_name ?? "";
    const lastName = user.user_metadata?.last_name ?? "";
    const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : user.email[0].toUpperCase();
    const displayName = firstName && lastName ? `${firstName} ${lastName[0]}.` : user.email;

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/auth/login");
    }

    return(
        <header className = "topbar">

            <div className = "topbar-left">
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
                    <div className="topbar-profile" onClick={() => setDropdownOpen(!dropdownOpen)} style={{ cursor: "pointer" }}>
                        <div className = "topbar-profile-picture">{initials}</div>
                        <span className = "topbar-name">{displayName}</span>
                        <ChevronDown size = {16} />
                    </div>

                    {dropdownOpen && (
                        <div className="topbar-dropdown">
                            <button className="topbar-dropdown-item" onClick={handleLogout}>
                                Log Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
