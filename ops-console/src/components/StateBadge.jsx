const STATE_COLORS = {
  received:            { color: "var(--muted)",   border: "var(--border)" },
  awaiting_validation: { color: "var(--accent-2)", border: "var(--accent-2)" },
  awaiting_approval:   { color: "var(--warn)",    border: "var(--warn)" },
  approved:            { color: "var(--accent)",  border: "var(--accent)" },
  releasing:           { color: "var(--accent-2)", border: "var(--accent-2)" },
  settlement_pending:  { color: "var(--accent)",  border: "var(--accent)" },
  settled:             { color: "var(--success)", border: "var(--success)" },
  failed:              { color: "var(--danger)",  border: "var(--danger)" },
  exception:           { color: "var(--danger)",  border: "var(--danger)" },
  pending_reconcile:   { color: "var(--warn)",    border: "var(--warn)" },
};

export default function StateBadge({ state }) {
  if (!state) {
    return <span className="text-xs" style={{ color: "var(--muted)" }}>—</span>;
  }

  const colors = STATE_COLORS[state] || { color: "var(--muted)", border: "var(--border)" };

  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide"
      style={{
        color: colors.color,
        border: `1px solid ${colors.border}`,
      }}
    >
      {state.replace(/_/g, " ")}
    </span>
  );
}
