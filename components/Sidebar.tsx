import {Home, List,  RefreshCcw, Handshake} from "lucide-react";
import Link from "next/link";

//Please reuse this file for the sidebar, which is for all pages. only part that has to be changed is div classname profile stuff once authentication is set up, currently its hardcoded
const navigationComponents = [
    {label: "Dashboard", href: "/dashboard", icon: <Home size={20} /> },
    {label: "Expenses", href: "/expenses", icon: <List size={20} />},
    {label: "Recurring Bills", href: "/recurring", icon: <RefreshCcw size={20} />},
    {label: "Settlements", href: "/settlements", icon: <Handshake size={20} />},
];

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <nav className = "sidebar-navigation">
                {navigationComponents.map((component) => (
                    <Link key={component.label} href={component.href} className={component.active ? "sidebar-item active" : "sidebar-item"}> //this line was generated with copilot
                        <span className = "sidebar-item-icon">{component.icon}</span>
                        <span> {component.label}</span>
                    </Link>
                ))}
            </nav>

            <div className = "sidebar-profile">
                <div className = "profile-picture">GS</div>
                <div className = "profile-info">
                    <div className = "profile-name">Guillermo S.</div>
                    <div className = "profile-email">example@ufl.edu</div>
                </div>
            </div>
        </aside>
    );
}

