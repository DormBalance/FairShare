"use client";

import { useEffect, useState } from "react";
import "./CreateExpenseModal.css";
import SelectMembers from "./SelectMembers";
import IconField from "./Field";
import { ClipboardIcon, DollarIcon, PenIcon } from "./Icons";

interface GUIElement {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    curUserID: string;
    curHouseholdID: string;
}

type HouseholdMember = {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
};

type ExpenseParticipant = {
    user_id: string;
    percent: number;
};

export default function CreateExpenseModal({
    isOpen,
    onClose,
    onSuccess,
    curUserID: curUserID,
    curHouseholdID: currentHouseholdId,
}: GUIElement) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [deadline, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [splitType, setSplitType] = useState("Equal");
    const [expenseParticipants, setExpenseParticipants] = useState<ExpenseParticipant[]>([]);
    const [payerUserId, setPayerUserId] = useState(curUserID);
    const [paymentType, setPaymentType] = useState("once");
    const [categoryId, setCategoryId] = useState("");
    
    const [household_members, setMembers] = useState<HouseholdMember[] | null>(null);
    const [categories, setCategories] = useState<{ category_id: string; category_name: string }[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState("");
    
    
    // Fetch household members and categories
    useEffect(
        () => {
            setLoading(true);
            
            let getMembers = async () => {
                try {
                    const response = await fetch(`/api/household_members?userId=${curUserID}`);
                    const data = await response.json();
                    const members = data;
                    setMembers(members);
                    
                    if (members.length > 0)
                        setPayerUserId(members[0].id);
                }
                catch {
                    setErrors("Household members could not be loaded. Please try again.");
                    setLoading(false);
                }
            };

            let getCategories = async () => {
                try {
                    const response = await fetch(`/api/expense_category?household_id=${currentHouseholdId}`);
                    const data = await response.json();
                    const categories = data.categories;

                    setCategories(categories);

                    if (categories.length > 0)
                        setCategoryId(categories[0].category_id);
                    else
                        setCategoryId("");
                }
                catch {
                    setErrors("Expense categories could not be loaded. Please try again.");
                }
                finally {
                    setLoading(false);
                }
            };
            
            getMembers();
            getCategories();
        }, 
        [isOpen, curUserID]
    );
    
    
    if (!isOpen) return null;
    
    type CreateExpenseBody = {
        expense_name: string;
        description?: string;
        household_id: string;
        creator_user_id: string;
        payer_user_id?: string;
        amount: string | number;
        split_type: string;
        expense_date: string;
        recurring_expense_id?: string;
        expense_category_id?: string;
        excluded_user_ids?: string[];
        included_user_ids?: string[];
        participants?: {
            user_id: string;
            percent: number;
        }[];
    };
    
    async function submitExpense() {
        if (!name || !amount) {
            setErrors("Name and amount required");
            return;
        }
        
        let body : CreateExpenseBody = {
            expense_name: name,
            amount: amount,
            household_id: currentHouseholdId,
            creator_user_id: curUserID,
            payer_user_id: payerUserId,
            split_type: splitType,
            expense_date: deadline,
            description: description || undefined,
        };
        
        if (splitType === "Equal")
            body.included_user_ids = expenseParticipants.map((participant) => participant.user_id);
        else
            body.participants = expenseParticipants;
        
        let formSubmission = JSON.stringify(body);
        
        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                body: formSubmission
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                setErrors(data.error?? "An error occurred");
                return;
            }
            
            onClose();
        }
        catch {
            setErrors("Network error");
        }
    }
    
    const loading_text = "...";
    
    return (
        <div className = "overlay">
        <div className = "modal">
        
        <div className = "topbar">
        
        <span/>
        <span>
            <h2>Add Expense</h2>
        </span>
        
        <span>
            <button onClick = {onClose}>X</button>
        </span>
        </div>
        {loading ? (<p>{loading_text}</p>) : (
            <>
            <div className="hor">
            <IconField
            name = "Name"
            value       = {name}
            onChange    = {(nameChange) => setName(nameChange.target.value)}
            icon        = {<PenIcon/>}
            />
            
            <IconField
                name = "Amount"
                value       = {amount}
                onChange    = {(amount) => setAmount(amount.target.value)}
                icon        = {<DollarIcon/>}
            />
            </div>
            
            <div className="hor">
                <IconField
                    name = "Description"
                    value       = {description}
                    onChange    = {(descriptionChange) => setDescription(descriptionChange.target.value)}
                    icon = {<ClipboardIcon/>}
                />
                <select
                    className   ="input"
                    name        = "Category"
                    value       = {categoryId}
                    onChange    = {(event) => {setCategoryId(event.target.value)}}
                >
                {
                    categories?.map((category) => (
                        <option key={category.category_id} value={category.category_id}>
                        {category.category_name}
                        </option>
                    ))
                }
                </select>
            </div>
            
            <div>
                <label>Split Method</label>
                
                <div className={`split-type ${splitType === "Custom" ? "slide-right" : ""}`}>
                    <button className={splitType === "Equal"  ? "active" : ""} onClick={() => setSplitType("Equal")}>Equal</button>
                    <button className={splitType === "Custom" ? "active" : ""} onClick={() => setSplitType("Custom")}>Custom</button>
                </div>
            </div>
            
            
            <label>Paid by</label>
            <select
            className = "input"
            value     = {payerUserId}
            onChange  = {(event) => {
                setPayerUserId(event.target.value); 
                setExpenseParticipants([])
            }}
            >
            {
                household_members?.map((member) => (
                    <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                    </option>
                ))
            }
            </select>
            
            <SelectMembers
            members       = {household_members ?? []}
            selectedIds   = {expenseParticipants.map((participant) => participant.user_id)}
            showAmounts   = {splitType === "Custom"}
            onToggleCheck = {(ids) =>
                setExpenseParticipants(ids.map((id) => ({ user_id: id, percent: 0 })))
            }
            onAmountChange = { (userId, percentSplit) => {
                setExpenseParticipants((prev) =>
                    Array.from(prev).map((participant) =>
                        participant.user_id === userId ? { user_id: userId, percent: percentSplit } : participant
                    )
                )
            }}/>            
    
    <label>{paymentType == "once" ? "Due Date" : "Start Date"}</label>
    <input id='deadline'
    type      = "date"
    value     = {deadline}
    onChange  = {(deadline)  => setDate(deadline.target.value)}
    className = "input"
    />
    
    { errors && 
        <p className = "error">{errors}</p>
    }
    
    <div className = "actions">
    <button className = "btn-submit" onClick = {submitExpense}>Add Expense</button>
    <button className = "btn-cancel" onClick = {onClose}>Cancel</button>
    </div>
    </>
)}
</div>
</div>
);
}