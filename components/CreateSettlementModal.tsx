"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useAuth } from "@/app/auth/auth";
import { createSettlement } from "@/lib/api";
import { localDateInputValue } from "@/lib/format";
import type { HouseholdMember } from "@/types";

type SettlementProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    curUserID: string;
    curHouseholdID: string;
    householdMembers?: HouseholdMember[];
};

const paymentMethods = ["Cash", "Venmo", "Zelle", "PayPal", "Other"];

export default function CreateSettlementModal(props: SettlementProps) {
    return props.isOpen ? <SettlementForm {...props} /> : null;
}

function SettlementForm({ onClose, onSuccess, curUserID, curHouseholdID, householdMembers }: SettlementProps) {
    const { session } = useAuth();
    const token = session?.access_token;
    const [members, setMembers] = useState(householdMembers);
    const [payer, setPayer] = useState(curUserID);
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState(paymentMethods[0]);
    const [date, setDate] = useState(localDateInputValue);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (householdMembers || !token || !curHouseholdID) return;

        const controller = new AbortController();
        async function loadMembers() {
            try {
                const response = await fetch(`/api/households/${curHouseholdID}/members`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error();
                setMembers(await response.json());
            } catch {
                if (!controller.signal.aborted) setError("Couldn’t load household members.");
            }
        }

        void loadMembers();
        return () => controller.abort();
    }, [curHouseholdID, householdMembers, token]);

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (submitting) return;
        if (!recipient || payer === recipient) {
            setError("Choose a different payer and recipient.");
            return;
        }

        setSubmitting(true);
        setError("");
        const result = await createSettlement({
            household_id: curHouseholdID,
            payer_user_id: payer,
            recipient_user_id: recipient,
            amount,
            payment_method: method,
            payment_date: date,
        });
        if (result.success === false) {
            setError(result.error);
            setSubmitting(false);
            return;
        }
        onSuccess();
        onClose();
    }

    return (
        <Modal title="Record a settlement" onClose={onClose} busy={submitting}>
            <p className="modal-description">Record a payment that’s already been made.</p>
            <form className="settlement-form" onSubmit={submit}>
                {!members && !error && <p role="status">Loading household members…</p>}
                {members && members.length < 2 && <p>Add another household member to record a payment.</p>}
                {members && members.length > 1 && (
                    <fieldset disabled={submitting}>
                        <label>Paid by
                            <select className="input" required value={payer} onChange={(event) => {
                                setPayer(event.target.value);
                                if (event.target.value === recipient) setRecipient("");
                            }}>
                                {members.map((member) => (
                                    <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>
                                ))}
                            </select>
                        </label>
                        <label>Paid to
                            <select className="input" required value={recipient} onChange={(event) => setRecipient(event.target.value)}>
                                <option value="">Choose a recipient</option>
                                {members.filter((member) => member.id !== payer).map((member) => (
                                    <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>
                                ))}
                            </select>
                        </label>
                        <label>Amount
                            <input className="input" type="number" min="0.01" step="0.01" required
                                value={amount} onChange={(event) => setAmount(event.target.value)} />
                        </label>
                        <label>Payment method
                            <select className="input" value={method} onChange={(event) => setMethod(event.target.value)}>
                                {paymentMethods.map((option) => <option key={option}>{option}</option>)}
                            </select>
                        </label>
                        <label>Payment date
                            <input className="input" type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
                        </label>
                    </fieldset>
                )}
                {error && <p className="error" role="alert">{error}</p>}
                <div className="actions">
                    <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button className="btn-submit" disabled={submitting || (members?.length ?? 0) < 2}>
                        {submitting ? "Recording…" : "Record payment"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
