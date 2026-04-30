export default function AuthorityBar({ token }) {
  const limit   = token.spend_limit || 0;
  const spent   = token.spent || 0;
  const pct     = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const revoked = token.revoked;

  return (
    <div className="mt-2 space-y-1.5">
      {/* Label row */}
      <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
        <span className="font-mono">{token.token_id}</span>
        <span>
          {revoked ? (
            <span className="font-semibold" style={{ color: "var(--danger)" }}>REVOKED</span>
          ) : (
            `$${spent.toFixed(2)} / $${limit.toFixed(2)} ${token.currency_restriction}`
          )}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--panel-2)", border: "1px solid var(--border)" }}
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

      {/* Footer row */}
      <div className="flex justify-between text-[11px]" style={{ color: "var(--muted)" }}>
        <span>depth: {token.depth_remaining}</span>
        <span>
          {revoked ? "no remaining authority" : `remaining $${(limit - spent).toFixed(2)}`}
        </span>
      </div>
    </div>
  );
}
