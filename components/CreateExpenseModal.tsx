"use client";

import { useEffect, useId, useState } from "react";
import { useAuth } from "@/app/auth/auth";
import { localDateInputValue } from "@/lib/format";
import type { HouseholdMember, SplitType } from "@/types";
import SelectMembers from "./SelectMembers";
import IconField from "./Field";
import { ClipboardIcon, DollarIcon, PenIcon } from "./Icons";
import Modal from "./Modal";

type ExpenseModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    curUserID: string;
    curHouseholdID: string;
    recurringOnly?: boolean;
};

type Category = { category_id: string; category_name: string };
type Participant = { user_id: string; percent: number };
type Frequency = "Once" | "Weekly" | "Monthly";

export default function CreateExpenseModal(props: ExpenseModalProps) {
    return props.isOpen ? <ExpenseForm {...props} /> : null;
}

function ExpenseForm({
    onClose, onSuccess, curUserID, curHouseholdID, recurringOnly = false,
}: ExpenseModalProps) {
    const token = useAuth().session?.access_token;
    const id = useId();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(localDateInputValue);
    const [splitType, setSplitType] = useState<SplitType>("Equal");
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [payer, setPayer] = useState(curUserID);
    const [frequency, setFrequency] = useState<Frequency>(recurringOnly ? "Monthly" : "Once");
    const [categoryId, setCategoryId] = useState("");
    const [members, setMembers] = useState<HouseholdMember[]>();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!curUserID || !curHouseholdID || !token) return;

        const controller = new AbortController();
        const options = { signal: controller.signal, headers: { Authorization: `Bearer ${token}` } };

        async function loadOptions() {
            try {
                const [membersResponse, categoriesResponse] = await Promise.all([
                    fetch(`/api/households/${curHouseholdID}/members`, options),
                    fetch(`/api/expense_category?household_id=${curHouseholdID}`, options),
                ]);
                if (!membersResponse.ok || !categoriesResponse.ok) throw new Error();

                const [householdMembers, categoryList] = await Promise.all([
                    membersResponse.json() as Promise<HouseholdMember[]>,
                    categoriesResponse.json() as Promise<{ categories: Category[] }>,
                ]);
                if (controller.signal.aborted) return;
                setMembers(householdMembers);
                setCategories(categoryList.categories);
                setCategoryId(categoryList.categories[0]?.category_id ?? "");
            } catch {
                if (!controller.signal.aborted) setError("Couldn’t load form options. Close and reopen to retry.");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        void loadOptions();
        return () => controller.abort();
    }, [curUserID, curHouseholdID, token]);

    const isRecurring = frequency !== "Once";
    const title = recurringOnly ? "Add recurring bill" : "Add expense";
    const totalPercent = participants.reduce((sum, participant) => sum + participant.percent, 0);

    function toggleParticipant(userId: string) {
        setParticipants((previous) => previous.some((entry) => entry.user_id === userId)
            ? previous.filter((entry) => entry.user_id !== userId)
            : [...previous, { user_id: userId, percent: 0 }]);
    }

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!members || submitting) return;
        if (!name.trim() || !/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0 || !date) {
            setError("Enter a name, a positive amount with up to two decimal places, and a date.");
            return;
        }
        if (!participants.length) {
            setError("Choose at least one person to split this expense with.");
            return;
        }
        if (splitType === "Custom" && Math.abs(totalPercent - 100) > 0.0001) {
            setError("Custom percentages must add up to 100%.");
            return;
        }

        setSubmitting(true);
        setError("");

        const body = {
            expense_name: name.trim(),
            description,
            amount,
            household_id: curHouseholdID,
            creator_user_id: curUserID,
            payer_user_id: payer,
            split_type: splitType,
            expense_category_id: categoryId || undefined,
            ...(isRecurring ? { next_expense_date: date, frequency } : { expense_date: date }),
            ...(splitType === "Custom" ? { participants } : {
                included_user_ids: participants.map(({ user_id }) => user_id),
            }),
        };

        try {
            const response = await fetch(isRecurring ? "/api/recurring_expenses" : "/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                setError(data?.error ?? "Couldn’t save the expense.");
                return;
            }
            onSuccess();
            onClose();
        } catch {
            setError("Couldn’t connect. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal title={title} onClose={onClose} busy={submitting}>
            {loading && <p role="status">Loading form…</p>}
            <form className="expense-form" onSubmit={submit}>
                {members && (
                    <fieldset className="expense-fields" disabled={submitting}>
                        <div className="hor">
                            <IconField name="Name" value={name} icon={<PenIcon />}
                                onChange={(event) => setName(event.target.value)} />
                            <IconField name="Amount" value={amount} icon={<DollarIcon />} type="number"
                                onChange={(event) => setAmount(event.target.value)} />
                        </div>
                        <div className="hor">
                            <IconField name="Description" value={description} icon={<ClipboardIcon />}
                                onChange={(event) => setDescription(event.target.value)} />
                            <label>Category
                                <select className="input" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                                    <option value="">No category</option>
                                    {categories.map((category) => (
                                        <option key={category.category_id} value={category.category_id}>{category.category_name}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <label>Paid by
                            <select className="input" value={payer} onChange={(event) => setPayer(event.target.value)}>
                                {members.map((member) => (
                                    <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>
                                ))}
                            </select>
                        </label>
                        <div>
                            <span className="field-label" id={`${id}-method`}>Split method</span>
                            <div className="split-type" role="group" aria-labelledby={`${id}-method`}>
                                <button type="button" aria-pressed={splitType === "Equal"} onClick={() => setSplitType("Equal")}>Equal</button>
                                <button type="button" aria-pressed={splitType === "Custom"} onClick={() => setSplitType("Custom")}>Custom percentages</button>
                            </div>
                        </div>
                        <SelectMembers members={members} participants={participants} showAmounts={splitType === "Custom"}
                            onToggle={toggleParticipant} onAmountChange={(userId, percent) => setParticipants((previous) =>
                                previous.map((entry) => entry.user_id === userId ? { ...entry, percent } : entry))} />
                        {splitType === "Custom" && <p className="modal-description">Total allocated {totalPercent.toFixed(2)}%</p>}
                        <div className="hor">
                            <IconField name={isRecurring ? "First due date" : "Expense date"} value={date} type="date"
                                onChange={(event) => setDate(event.target.value)} />
                            <label>Recurrence
                                <select className="input" value={frequency} onChange={(event) => setFrequency(event.target.value as Frequency)}>
                                    {!recurringOnly && <option value="Once">One-time</option>}
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                </select>
                            </label>
                        </div>
                    </fieldset>
                )}
                {error && <p className="error" role="alert">{error}</p>}
                <div className="actions">
                    <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button className="btn-submit" disabled={submitting || !members}>{submitting ? "Saving…" : title}</button>
                </div>
            </form>
        </Modal>
    );
}
