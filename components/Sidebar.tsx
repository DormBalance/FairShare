'use client';
import {Home, List,  RefreshCcw, Handshake} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/auth/auth";

//Please reuse this file for the sidebar, which is for all pages. only part that has to be changed is div classname profile stuff once authentication is set up, currently its hardcoded
//no more hardcoding for you mr monkey guillermo, you are so awesome and cute
//i will come back to this and add first name last name, right now the authentication only fetches the email
const navigationComponents = [
    {label: "Dashboard", href: "/dashboard", icon: <Home size={20} /> },
    {label: "Expenses", href: "/expenses", icon: <List size={20} />},
    {label: "Recurring Bills", href: "/recurring", icon: <RefreshCcw size={20} />},
    {label: "Settlements", href: "/settlements", icon: <Handshake size={20} />},
];

export default function Sidebar() {
    const { user } = useAuth();

    if (!user) return null;

    const firstName = user.user_metadata?.first_name ?? "";
    const lastName = user.user_metadata?.last_name ?? "";
    const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : user.email[0].toUpperCase();
    const displayName = firstName && lastName ? `${firstName} ${lastName[0]}.` : user.email;

    return (
        <aside className="sidebar">
            <nav className = "sidebar-navigation">
                {navigationComponents.map((component) => (
                    <Link key={component.label} href={component.href} className="sidebar-item">
                        <span className = "sidebar-item-icon">{component.icon}</span>
                        <span> {component.label}</span>
                    </Link>
                ))}
            </nav>

            <div className = "sidebar-profile">
                <div className = "profile-picture">{initials}</div>
                <div className = "profile-info">
                    <div className = "profile-name">{displayName}</div>
                    <div className = "profile-email">{user.email}</div>
                </div>
            </div>
        </aside>
    );
}

