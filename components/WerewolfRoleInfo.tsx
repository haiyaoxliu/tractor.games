"use client";

import { useState } from "react";
import { ROLES, ROLE_DESCRIPTIONS, NIGHT_ORDER } from "@/convex/werewolfGameLogic";

export default function WerewolfRoleInfo() {
  const [open, setOpen] = useState(false);

  const allRoles = [
    ...NIGHT_ORDER,
    ...Object.keys(ROLES).filter(r => !NIGHT_ORDER.includes(r)),
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          background: "none",
          border: "1px solid #667eea",
          color: "#667eea",
          borderRadius: 8,
          padding: "6px 14px",
          cursor: "pointer",
          fontSize: "0.85rem",
          fontWeight: 600,
        }}
      >
        ? Role Guide
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "1.5rem",
          maxWidth: 500,
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Role Guide</h3>
          <button
            onClick={() => setOpen(false)}
            style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#999" }}
          >
            ×
          </button>
        </div>

        <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "1rem" }}>
          Night wake order (top to bottom):
        </p>

        {allRoles.map((roleKey) => {
          const def = ROLES[roleKey];
          if (!def) return null;
          const teamColor =
            def.team === "werewolf" ? "#dc3545" :
            def.team === "village" ? "#28a745" :
            def.team === "independent" ? "#fd7e14" :
            "#6f42c1";

          return (
            <div
              key={roleKey}
              style={{
                padding: "0.6rem 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{def.name}</span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: teamColor,
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  {def.team}
                </span>
                {def.hasNightAction && (
                  <span style={{ fontSize: "0.7rem", color: "#888" }}>
                    Night #{def.nightOrder}
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#555" }}>
                {ROLE_DESCRIPTIONS[roleKey]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
