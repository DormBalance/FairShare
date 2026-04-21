"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";

type AuthContextType = {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp(email: string, password: string): Promise<{error: string | null}>;
    signIn(email: string, password: string): Promise<{error: string | null}>;
    signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getSession():Promise<void> {
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Error getting session:", error.message); // prompt user to relogin or signup
            }

            setSession(data.session ?? null);
            setUser(data.session?.user ?? null);
            setLoading(false);
        }

        getSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session ?? null);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };


    }, []);

        async function signUp( email: string, password: string): Promise<{error: string | null}>{
            const { error } = await supabase.auth.signUp({ email, password});

            if(error){
                console.error("Error signing up:", error.message); //message that the email is not allowed or the password does not fit standard
                return {error: error.message};
            }


            return {error: null};
        }

        async function signIn(email: string, password: string): Promise<{error: string | null}>{
            const { error } = await supabase.auth.signInWithPassword({email, password});

            if(error){
                console.error("Error signing in:", error.message); //screen or message that the email or password is incorrect
                return {error: error.message};
            }

            return {error: null};
        }

        async function signOut(): Promise<void>{
            await supabase.auth.signOut();
        }



    return (
        <AuthContext.Provider value={{ user, session, loading,  signUp, signIn, signOut}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
}