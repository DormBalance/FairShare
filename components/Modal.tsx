"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import "./CreateExpenseModal.css";

type ModalProps = {
    title: string;
    onClose: () => void;
    busy?: boolean;
    children: React.ReactNode;
};

export default function Modal({ title, onClose, busy, children }: ModalProps) {
    const dialog = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const element = dialog.current;
        element?.showModal();
        return () => element?.close();
    }, []);

    return (
        <dialog ref={dialog} className="modal" aria-label={title} onCancel={(event) => {
            event.preventDefault();
            if (!busy) onClose();
        }}>
            <div className="modal-heading">
                <h2>{title}</h2>
                <button type="button" aria-label="Close dialog" disabled={busy} onClick={onClose}>
                    <X size={20} aria-hidden="true" />
                </button>
            </div>
            {children}
        </dialog>
    );
}
