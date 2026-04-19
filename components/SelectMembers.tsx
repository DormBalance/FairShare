import "./SelectMembers.css";

type Member = {
  id: string;
  first_name: string;
  last_name: string;
};

interface SelectedMembers {
  members: Member[];
  selectedIds: string[];
  showAmounts: boolean;
  onToggleCheck: (selectedIds: string[]) => void;
  onAmountChange: (userId: string, amount: number) => void;
}

export default function SelectMembers({ members, selectedIds: selectedUserIds, showAmounts, onToggleCheck, onAmountChange }: SelectedMembers) {
  return (
    <div className = "member-selection">
      <span className = "participation-param">
        { members.map((member) => (
          <div key={member.id}>
            <label>
              <input
                type      = "checkbox"
                checked   = {selectedUserIds.includes(member.id)}
                onChange  = {() => {
                  if (selectedUserIds.includes(member.id))
                    onToggleCheck(selectedUserIds.filter((id) => id !== member.id));
                  else
                    onToggleCheck(Array.from(selectedUserIds).concat(member.id));
                }}
              />
              {member.first_name} {member.last_name}
            </label>
            <div className = "amounts" style = {{ visibility: showAmounts ? "visible" : "hidden" }}>
              <input
                type          = "number"
                min           = {0}
                max           = {100000}
                defaultValue  = {0}
                disabled      = {!UserInMember(selectedUserIds, member)}
                onChange      = {(changeAmount) => onAmountChange(member.id, Number(changeAmount.target.value))}
              />%
            </div>
          </div>
        ))}
      </span>
    </div>
  );
}
function UserInMember(selectedUserIds: string[], member: Member) {
  return selectedUserIds.includes(member.id);
}
