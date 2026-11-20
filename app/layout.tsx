import type { Metadata } from "next";
import { AuthProvider } from "@/app/auth/auth";
import "./dashboard/dashboard.css";
import "./account.css";

export const metadata: Metadata = {
    title: "FairShare",
    description: "Manage shared expenses with your roommates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
