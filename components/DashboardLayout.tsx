import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

//this code below was autocompleted by copilot
type DashboardLayoutProps = {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) { 
    return (
        <div className="dashboard-layout">
            <Topbar />
            <div className="dashboard-content">
                <Sidebar />
                <main className = "main-content">{children}</main>
            </div>
        </div>
    );
}