import { useEffect, useState } from "react";
import { api } from "../api.js";
import StateBadge from "../components/StateBadge.jsx";

export default function ApprovalQueue() {
  const [tasks, setTasks]     = useState([]);
  const [operator, setOp]     = useState("ops_admin");
  const [busyId, setBusyId]   = useState(null);
  const [error, setError]     = useState(null);

  const load = () =>
    api.awaitingApproval()
      .then(setTasks)
      .catch((e) => setError(String(e)));

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    const onRefresh = () => load();
    window.addEventListener("ops:refresh", onRefresh);
    return () => {
      clearInterval(t);
      window.removeEventListener("ops:refresh", onRefresh);
    };
  }, []);

  const approve = async (id) => {
    setBusyId(id);
    setError(null);
    try {
      await api.approve(id, operator);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Approval Queue</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            Tasks paused at <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: "var(--panel-2)" }}>awaiting_approval</code>.
            Operator approval re-validates release policy and resumes the workflow.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: "var(--muted)" }} htmlFor="op">Operator:</label>
          <input
            id="op"
            value={operator}
            onChange={(e) => setOp(e.target.value)}
            className="px-2.5 py-1.5 rounded-md text-sm font-sans"
            style={{
              backgroundColor: "var(--panel)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg border" style={{ borderColor: "var(--danger)", background: "rgba(248,113,113,0.08)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="py-8 text-center rounded-lg border border-dashed" style={{ color: "var(--muted)", borderColor: "var(--border)" }}>
          No tasks awaiting approval. Use "Seed demos" in the header to populate.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Task", "Amount", "Merchant", "Initiated by", "Token", "State", "Liability", ""].map((h) => (
                  <th
                    key={h || "action"}
                    className="text-left px-3 py-2.5 text-[11px] uppercase tracking-wide font-medium"
                    style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr
                  key={t.task_id}
                  className="transition-colors hover:bg-[--panel-2]"
                >
                  <td className="px-3 py-2.5 font-mono text-sm" style={{ borderBottom: "1px solid var(--border)" }}>{t.task_id}</td>
                  <td className="px-3 py-2.5 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>${t.amount.toFixed(2)} {t.currency}</td>
                  <td className="px-3 py-2.5 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>{t.merchant_name}</td>
                  <td className="px-3 py-2.5 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>{t.initiated_by}</td>
                  <td className="px-3 py-2.5 font-mono text-sm" style={{ borderBottom: "1px solid var(--border)" }}>{t.token_id}</td>
                  <td className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}><StateBadge state={t.state} /></td>
                  <td className="px-3 py-2.5 text-sm" style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>{t.liability_owner}</td>
                  <td className="px-3 py-2.5 text-right" style={{ borderBottom: "1px solid var(--border)" }}>
                    <button
                      disabled={busyId === t.task_id || !operator.trim()}
                      onClick={() => approve(t.task_id)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105"
                      style={{
                        backgroundColor: "var(--accent)",
                        color: "#042b27",
                        border: "1px solid var(--accent)",
                      }}
                    >
                      {busyId === t.task_id ? "Approving..." : "Approve"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
