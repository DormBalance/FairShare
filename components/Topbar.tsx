'use client';
import {ChevronDown, Bell, Search, Home} from "lucide-react";
import { useAuth } from "@/app/auth/auth";

export default function Topbar(){
    const { user } = useAuth();

    if (!user) return null;

    const firstName = user.user_metadata?.first_name ?? "";
    const lastName = user.user_metadata?.last_name ?? "";
    const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : user.email[0].toUpperCase();
    const displayName = firstName && lastName ? `${firstName} ${lastName[0]}.` : user.email;

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

                    <div className = "topbar-profile">
                        <div className = "topbar-profile-picture">{initials}</div>
                        <span className = "topbar-name">{displayName}</span>
                        <ChevronDown size = {16} />
                </div>
             </div>
        </header>
    )
}
