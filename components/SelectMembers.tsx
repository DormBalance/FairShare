import type { HouseholdMember } from "@/types";

type SelectedMembersProps = {
    members: HouseholdMember[];
    participants: { user_id: string; percent: number }[];
    showAmounts: boolean;
    onToggle: (userId: string) => void;
    onAmountChange: (userId: string, percent: number) => void;
};

export default function SelectMembers({ members, participants, showAmounts, onToggle, onAmountChange }: SelectedMembersProps) {
    return (
        <fieldset className="member-selection">
            <legend>Split between</legend>
            {members.map((member) => {
                const name = `${member.first_name} ${member.last_name}`;
                const participant = participants.find(({ user_id }) => user_id === member.id);

                return (
                    <div key={member.id} className="member-option">
                        <label>
                            <input type="checkbox" checked={Boolean(participant)} onChange={() => onToggle(member.id)} />
                            {name}
                        </label>
                        {showAmounts && <div className="member-share">
                            <input className="input" type="number" min="0" max="100" step="any" aria-label={`${name} percentage`}
                                value={participant?.percent ?? ""} disabled={!participant}
                                onChange={(event) => onAmountChange(member.id, Number(event.target.value))} />
                            <span aria-hidden="true">%</span>
                        </div>}
                    </div>
                );
            })}
        </fieldset>
    );
}
