import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="dashboard-layout">
            <a className="skip-link" href="#main-content">Skip to content</a>
            <Topbar />
            <div className="dashboard-content">
                <Sidebar />
                <main id="main-content" className="main-content" tabIndex={-1}>{children}</main>
            </div>
        </div>
    );
}
