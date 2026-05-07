import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function ControlPlaneSummary() {
  const [cp, setCp]           = useState(null);
  const [error, setError]     = useState(null);
  const [busy, setBusy]       = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);

  const load = () =>
    api.controlPlane()
      .then(setCp)
      .catch((e) => setError(String(e)));

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const toggleKill = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.setKillSwitch(!cp.kill_switch);
      setCp({ ...cp, kill_switch: r.kill_switch });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = () => {
    const r = cp.rail_controls;
    setDraft({
      max_amount:              r.max_amount,
      approval_required_above: r.approval_required_above,
      supported_currencies:    r.supported_currencies.join(", "),
      idempotency_window_secs: r.idempotency_window_secs,
      release_timeout_secs:    r.release_timeout_secs,
    });
    setSaveMsg(null);
    setEditing(true);
  };

  const saveEdit = async () => {
    setBusy(true);
    setSaveMsg(null);
    try {
      const payload = {
        max_amount:              parseFloat(draft.max_amount),
        approval_required_above: parseFloat(draft.approval_required_above),
        supported_currencies:    draft.supported_currencies.split(",").map((s) => s.trim()).filter(Boolean),
        idempotency_window_secs: parseInt(draft.idempotency_window_secs, 10),
        release_timeout_secs:    parseInt(draft.release_timeout_secs, 10),
      };
      const updated = await api.updateRailControls(payload);
      setCp({ ...cp, rail_controls: updated });
      setEditing(false);
      setSaveMsg("Saved");
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (e) {
      setSaveMsg(`Error: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="px-4 py-3 rounded-lg border" style={{ borderColor: "var(--danger)", background: "rgba(248,113,113,0.08)", color: "var(--danger)" }}>
        {error}
      </div>
    );
  }

  if (!cp) {
    return (
      <div className="py-8 text-center rounded-lg border border-dashed" style={{ color: "var(--muted)", borderColor: "var(--border)" }}>
        Loading control plane...
      </div>
    );
  }

  const r = cp.rail_controls;

  return (
    <>
      {/* Header */}
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Control Plane</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            Configuration registry consumed by every other service. Rail controls are operator-editable. Version <span className="font-mono">{cp.version}</span>.
          </p>
        </div>
        <button
          disabled={busy}
          onClick={toggleKill}
          className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={cp.kill_switch
            ? { backgroundColor: "var(--accent)", color: "#042b27", border: "1px solid var(--accent)" }
            : { backgroundColor: "transparent", color: "var(--danger)", border: "1px solid var(--danger)" }
          }
        >
          {cp.kill_switch ? "Disable kill switch" : "ACTIVATE kill switch"}
        </button>
      </div>

      {/* Status + Rail Controls grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Status panel */}
        <div
          className="rounded-lg border p-4"
          style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h3 className="text-[11px] uppercase tracking-wide font-medium mb-3" style={{ color: "var(--muted)" }}>
            Status
          </h3>
          <div className="grid gap-x-3.5 gap-y-1.5" style={{ gridTemplateColumns: "160px 1fr" }}>
            <div className="text-sm" style={{ color: "var(--muted)" }}>version</div>
            <div className="text-sm font-mono" style={{ color: "var(--text)" }}>{cp.version}</div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>kill switch</div>
            <div className="text-sm">
              {cp.kill_switch
                ? <span className="font-semibold" style={{ color: "var(--danger)" }}>ACTIVE — payments blocked</span>
                : <span style={{ color: "var(--success)" }}>off — payments processing</span>}
            </div>
          </div>
        </div>

        {/* Rail Controls panel */}
        <div
          className="rounded-lg border p-4"
          style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] uppercase tracking-wide font-medium" style={{ color: "var(--muted)" }}>
              Rail Controls
            </h3>
            {!editing ? (
              <button
                onClick={startEdit}
                className="text-[11px] px-2 py-0.5 rounded border transition-colors"
                style={{ color: "var(--accent)", borderColor: "var(--accent)", backgroundColor: "transparent" }}
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditing(false); setSaveMsg(null); }}
                  disabled={busy}
                  className="text-[11px] px-2 py-0.5 rounded border transition-colors disabled:opacity-50"
                  style={{ color: "var(--muted)", borderColor: "var(--border)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={busy}
                  className="text-[11px] px-2 py-0.5 rounded border transition-colors disabled:opacity-50"
                  style={{ color: "#042b27", backgroundColor: "var(--accent)", borderColor: "var(--accent)" }}
                >
                  {busy ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>

          {saveMsg && (
            <div
              className="text-xs mb-2 px-2 py-1 rounded"
              style={{
                color: saveMsg.startsWith("Error") ? "var(--danger)" : "var(--success)",
                backgroundColor: saveMsg.startsWith("Error") ? "rgba(248,113,113,0.08)" : "rgba(52,211,153,0.08)",
                border: `1px solid ${saveMsg.startsWith("Error") ? "var(--danger)" : "var(--success)"}`,
              }}
            >
              {saveMsg}
            </div>
          )}

          {editing ? (
            <div className="grid gap-x-3.5 gap-y-2.5" style={{ gridTemplateColumns: "160px 1fr" }}>
              {[
                { label: "max amount ($)", key: "max_amount", type: "number" },
                { label: "approval above ($)", key: "approval_required_above", type: "number" },
                { label: "currencies (CSV)", key: "supported_currencies", type: "text" },
                { label: "idempotency window (s)", key: "idempotency_window_secs", type: "number" },
                { label: "release timeout (s)", key: "release_timeout_secs", type: "number" },
              ].map(({ label, key, type }) => (
                <>
                  <div key={`lbl-${key}`} className="text-sm flex items-center" style={{ color: "var(--muted)" }}>{label}</div>
                  <input
                    key={`inp-${key}`}
                    type={type}
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                    className="text-sm px-2 py-1 rounded border w-full"
                    style={{
                      backgroundColor: "var(--panel-2)",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                      outline: "none",
                    }}
                  />
                </>
              ))}
            </div>
          ) : (
            <div className="grid gap-x-3.5 gap-y-1.5" style={{ gridTemplateColumns: "160px 1fr" }}>
              <div className="text-sm" style={{ color: "var(--muted)" }}>max amount</div>
              <div className="text-sm" style={{ color: "var(--text)" }}>${r.max_amount.toLocaleString()}</div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>approval required above</div>
              <div className="text-sm" style={{ color: "var(--text)" }}>${r.approval_required_above.toLocaleString()}</div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>supported currencies</div>
              <div className="text-sm" style={{ color: "var(--text)" }}>{r.supported_currencies.join(", ")}</div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>idempotency window</div>
              <div className="text-sm" style={{ color: "var(--text)" }}>{r.idempotency_window_secs}s</div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>release timeout</div>
              <div className="text-sm" style={{ color: "var(--text)" }}>{r.release_timeout_secs}s</div>
            </div>
          )}
        </div>
      </div>

      {/* Capabilities Registry */}
      <div
        className="rounded-lg border p-4 mb-4"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
      >
        <h3 className="text-[11px] uppercase tracking-wide font-medium mb-3" style={{ color: "var(--muted)" }}>
          Capabilities Registry
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Name", "Type", "Side effect", "Idempotent", "Description"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 text-[11px] uppercase tracking-wide font-medium"
                    style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cp.capabilities.map((c) => (
                <tr key={c.name} className="transition-colors hover:bg-[--panel-2]">
                  <td className="px-3 py-2 font-mono text-sm" style={{ borderBottom: "1px solid var(--border)" }}>{c.name}</td>
                  <td className="px-3 py-2 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>{c.type}</td>
                  <td className="px-3 py-2 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>
                    {c.has_side_effect
                      ? <span style={{ color: "var(--danger)" }}>yes ⚠</span>
                      : <span style={{ color: "var(--muted)" }}>no</span>}
                  </td>
                  <td className="px-3 py-2 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>
                    {c.idempotent
                      ? "yes"
                      : <span style={{ color: "var(--warn)" }}>no</span>}
                  </td>
                  <td className="px-3 py-2 text-sm" style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>{c.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agents Registry */}
      <div
        className="rounded-lg border p-4"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
      >
        <h3 className="text-[11px] uppercase tracking-wide font-medium mb-3" style={{ color: "var(--muted)" }}>
          Agents Registry
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Agent ID", "Role", "Actions", "Description"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 text-[11px] uppercase tracking-wide font-medium"
                    style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cp.agents.map((a) => (
                <tr key={a.agent_id} className="transition-colors hover:bg-[--panel-2]">
                  <td className="px-3 py-2 font-mono text-sm" style={{ borderBottom: "1px solid var(--border)" }}>{a.agent_id}</td>
                  <td className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                    <StateBadgeInline role={a.role} />
                  </td>
                  <td className="px-3 py-2 font-mono text-sm" style={{ borderBottom: "1px solid var(--border)" }}>{a.actions.join(", ")}</td>
                  <td className="px-3 py-2 text-sm" style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>{a.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function StateBadgeInline({ role }) {
  const colors = role === "parent"
    ? { color: "var(--accent)", border: "var(--accent)" }
    : { color: "var(--muted)", border: "var(--border)" };

  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide"
      style={{ color: colors.color, border: `1px solid ${colors.border}` }}
    >
      {role}
    </span>
  );
}
