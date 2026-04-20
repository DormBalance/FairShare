// "use client";

// import { useEffect, useState } from "react";
// import "./CreateExpenseModal.css";
// import { createSettlement } from "@/lib/api";
// import { HouseholdMember } from "@/types";

// interface GUIElement {
//     isOpen: boolean;
//     onClose: () => void;
//     onSuccess: () => void;
//     curUserID: string;
//     curHouseholdID: string;
// }

// export default function CreateSettlementModal({
//     isOpen,
//     onClose,
//     onSuccess,
//     curUserID,
//     curHouseholdID
// }: GUIElement) {
//     const [recipientUserId, setRecipientUserId] = useState<string>("");
//     const [payerUserId, setPayerUserId] = useState<string>(curUserID);
//     const [amount, setAmount] = useState<string>("");
//     const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
//     const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
// }