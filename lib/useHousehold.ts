"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/auth/auth";
import type { HouseholdMember } from "@/types";

type Household = { id: string; name: string };
type Member = HouseholdMember & { email: string };
type HouseholdState =
    | { status: "loading" | "empty" | "error" }
    | { status: "ready"; household: Household; members: Member[]; member: Member };

export function useHousehold(): HouseholdState {
    const { session, user, loading } = useAuth();
    const [state, setState] = useState<HouseholdState>({ status: "loading" });
    const token = session?.access_token;
    const email = user?.email;

    useEffect(() => {
        if (!token) return;

        const controller = new AbortController();
        const options = { signal: controller.signal, headers: { Authorization: `Bearer ${token}` } };

        async function load() {
            try {
                const response = await fetch("/api/households", options);
                if (!response.ok) throw new Error("Could not load households");
                const [household]: Household[] = await response.json();
                if (!household) {
                    setState({ status: "empty" });
                    return;
                }

                const membersResponse = await fetch(`/api/households/${household.id}/members`, options);
                if (!membersResponse.ok) throw new Error("Could not load members");
                const members: Member[] = await membersResponse.json();
                const member = members.find((entry) => entry.email === email);
                if (!member) throw new Error("Member profile missing");

                setState({ status: "ready", household, members, member });
            } catch {
                if (!controller.signal.aborted) setState({ status: "error" });
            }
        }

        void load();
        return () => controller.abort();
    }, [token, email]);

    if (!token) return { status: loading ? "loading" : "error" };
    return state;
}
