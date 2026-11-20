import { useId, type ChangeEventHandler, type ReactNode } from "react";

type FieldProps = {
    name: string;
    value: string | number;
    icon?: ReactNode;
    type?: string;
    placeholder?: string;
    onChange?: ChangeEventHandler<HTMLInputElement>;
};

export default function IconField({ name, value, icon, type = "text", placeholder = "", onChange }: FieldProps) {
    const id = useId();

    return (
        <div>
            <label htmlFor={id}>{name}</label>
            <div className="input-box">
                {icon && <span aria-hidden="true">{icon}</span>}
                <input id={id} className="input" value={value} type={type} placeholder={placeholder}
                    step={type === "number" ? "0.01" : undefined} onChange={onChange} />
            </div>
        </div>
    );
}
