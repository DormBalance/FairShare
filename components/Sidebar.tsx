"use client";

import { LayoutDashboard, Receipt, RefreshCcw, Handshake } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
    { label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard },
    { label: "Expenses", href: "/expenses", Icon: Receipt },
    { label: "Recurring Bills", href: "/recurring", Icon: RefreshCcw },
    { label: "Settlements", href: "/settlements", Icon: Handshake },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            <nav className="sidebar-navigation" aria-label="Household finances">
                {navigation.map(({ label, href, Icon }) => (
                    <Link key={href} href={href} className="sidebar-item"
                        aria-current={pathname === href ? "page" : undefined}>
                        <Icon size={20} aria-hidden="true" />
                        <span>{label}</span>
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
