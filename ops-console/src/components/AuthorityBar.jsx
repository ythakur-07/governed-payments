export default function AuthorityBar({ token }) {
  const limit   = token.spend_limit || 0;
  const spent   = token.spent || 0;
  const pct     = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const revoked = token.revoked;
  const remaining = limit - spent;

  return (
    <div
      className="rounded-lg border p-3.5 mt-2"
      style={{
        backgroundColor: "var(--panel-2)",
        borderColor: revoked ? "var(--danger)" : "var(--border)",
      }}
    >
      {/* Status banner */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
            style={{
              color: revoked ? "var(--danger)" : "var(--success)",
              border: `1px solid ${revoked ? "var(--danger)" : "var(--success)"}`,
            }}
          >
            {revoked ? "Revoked" : "Active"}
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
            {revoked
              ? "This token has been cancelled — the agent cannot act."
              : `Agent may spend up to $${remaining.toFixed(2)} more`}
          </span>
        </div>
        <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{token.token_id}</span>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 rounded-full overflow-hidden mb-2"
        style={{ backgroundColor: "var(--panel)", border: "1px solid var(--border)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: revoked ? "100%" : `${pct}%`,
            background: revoked
              ? "var(--danger)"
              : "linear-gradient(90deg, var(--accent), var(--accent-2))",
          }}
        />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-[11px]">
        <div>
          <span style={{ color: "var(--muted)" }}>Limit: </span>
          <span style={{ color: "var(--text)" }}>${limit.toFixed(2)} {token.currency_restriction}</span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>Spent: </span>
          <span style={{ color: "var(--text)" }}>${spent.toFixed(2)}</span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>Sub-delegation depth: </span>
          <span style={{ color: "var(--text)" }}>{token.depth_remaining} level(s) remaining</span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>Merchants: </span>
          <span style={{ color: "var(--text)" }}>{token.merchant_allowlist?.length ?? 0} allowed</span>
        </div>
      </div>

      {revoked && (
        <p className="text-[11px] mt-2 leading-relaxed" style={{ color: "var(--danger)" }}>
          Revocation is immediate and system-wide. Any payment attempt using this token is rejected
          before any action is taken, regardless of amount or merchant.
        </p>
      )}
    </div>
  );
}
