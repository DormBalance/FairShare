import {ChevronDown, Bell, Search, Home} from "lucide-react";
//please remember to reuse this in every page alongside sidebar!
export default function Topbar(){
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
                        <div className = "topbar-profile-picture">GS</div>
                        <span className = "topbar-name">Guillermo S.</span> //only 2 components that need to be changed once authentication is handled by AJ
                        <ChevronDown size = {16} />
                </div>
             </div>
        </header>
    )
}