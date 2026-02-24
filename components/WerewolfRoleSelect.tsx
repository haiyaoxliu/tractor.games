"use client";

import { ROLES, ROLE_DESCRIPTIONS, NIGHT_ORDER } from "@/convex/werewolfGameLogic";
import WerewolfRoleInfo from "./WerewolfRoleInfo";

interface WerewolfRoleSelectProps {
  selectedRoles: string[];
  onRolesChange: (roles: string[]) => void;
  playerCount: number;
  disabled?: boolean;
}

export default function WerewolfRoleSelect({
  selectedRoles,
  onRolesChange,
  playerCount,
  disabled,
}: WerewolfRoleSelectProps) {
  const requiredCount = playerCount + 3;
  const currentCount = selectedRoles.length;
  const isValid = currentCount === requiredCount;

  // Count each role in selection
  const roleCounts: Record<string, number> = {};
  for (const r of selectedRoles) {
    roleCounts[r] = (roleCounts[r] ?? 0) + 1;
  }

  const allRoleKeys = [
    ...NIGHT_ORDER,
    ...Object.keys(ROLES).filter(r => !NIGHT_ORDER.includes(r)),
  ];

  const addRole = (role: string) => {
    const count = roleCounts[role] ?? 0;
    if (count < ROLES[role].maxCopies && currentCount < requiredCount) {
      onRolesChange([...selectedRoles, role]);
    }
  };

  const removeRole = (role: string) => {
    const idx = selectedRoles.lastIndexOf(role);
    if (idx >= 0) {
      const newRoles = [...selectedRoles];
      newRoles.splice(idx, 1);
      onRolesChange(newRoles);
    }
  };

  return (
    <div style={{ textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: "1rem" }}>
            Select Roles
          </span>
          <span
            style={{
              marginLeft: 8,
              fontSize: "0.9rem",
              color: isValid ? "#28a745" : "#dc3545",
              fontWeight: 600,
            }}
          >
            {currentCount}/{requiredCount}
          </span>
        </div>
        <WerewolfRoleInfo />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.5rem" }}>
        {allRoleKeys.map((roleKey) => {
          const def = ROLES[roleKey];
          if (!def) return null;
          const count = roleCounts[roleKey] ?? 0;
          const canAdd = count < def.maxCopies && currentCount < requiredCount;
          const canRemove = count > 0;

          const teamColor =
            def.team === "werewolf" ? "#dc3545" :
            def.team === "village" ? "#28a745" :
            def.team === "independent" ? "#fd7e14" :
            "#6f42c1";

          return (
            <div
              key={roleKey}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 10px",
                background: count > 0 ? "#f0f0ff" : "#f8f9fa",
                border: `1px solid ${count > 0 ? teamColor : "#ddd"}`,
                borderRadius: 8,
                fontSize: "0.8rem",
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: teamColor,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {def.name}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => removeRole(roleKey)}
                  disabled={!canRemove || disabled}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    border: "1px solid #ccc",
                    background: canRemove && !disabled ? "#fff" : "#eee",
                    cursor: canRemove && !disabled ? "pointer" : "not-allowed",
                    fontWeight: 700,
                    fontSize: "1rem",
                    lineHeight: 1,
                    color: "#666",
                  }}
                >
                  -
                </button>
                <span style={{ width: 18, textAlign: "center", fontWeight: 700 }}>{count}</span>
                <button
                  onClick={() => addRole(roleKey)}
                  disabled={!canAdd || disabled}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    border: "1px solid #ccc",
                    background: canAdd && !disabled ? "#fff" : "#eee",
                    cursor: canAdd && !disabled ? "pointer" : "not-allowed",
                    fontWeight: 700,
                    fontSize: "1rem",
                    lineHeight: 1,
                    color: "#666",
                  }}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
