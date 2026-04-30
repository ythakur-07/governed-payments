import { useEffect, useState } from "react";
import { api } from "../api.js";
import StateBadge from "../components/StateBadge.jsx";

export default function TaskExplorer() {
  const [tasks, setTasks]   = useState([]);
  const [selected, setSel]  = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError]   = useState(null);

  const loadList = () =>
    api.tasks()
      .then((rows) => {
        setTasks(rows);
        if (!selected && rows.length) setSel(rows[0].task_id);
      })
      .catch((e) => setError(String(e)));

  useEffect(() => {
    loadList();
    const t = setInterval(loadList, 3000);
    const onRefresh = () => loadList();
    window.addEventListener("ops:refresh", onRefresh);
    return () => {
      clearInterval(t);
      window.removeEventListener("ops:refresh", onRefresh);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    let alive = true;
    const load = () =>
      api.task(selected)
        .then((d) => { if (alive) setDetail(d); })
        .catch((e) => alive && setError(String(e)));
    load();
    const t = setInterval(load, 3000);
    return () => { alive = false; clearInterval(t); };
  }, [selected]);

  return (
    <>
      {/* Header */}
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Task Explorer</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            Current state from <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: "var(--panel-2)" }}>context_memory</code> &middot; full evidence log from <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: "var(--panel-2)" }}>provenance</code>.
            Two boundaries, one merged view.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg border" style={{ borderColor: "var(--danger)", background: "rgba(248,113,113,0.08)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: "260px 1fr" }}>
        {/* Task list panel */}
        <div
          className="rounded-lg border overflow-auto"
          style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)", maxHeight: "70vh" }}
        >
          <h3
            className="text-[11px] uppercase tracking-wide font-medium px-3.5 pt-3"
            style={{ color: "var(--muted)" }}
          >
            Tasks
          </h3>

          {tasks.length === 0 ? (
            <p className="px-3.5 py-4 text-sm" style={{ color: "var(--muted)" }}>
              No tasks yet. Use "Seed demos".
            </p>
          ) : (
            <table className="w-full border-collapse">
              <tbody>
                {tasks.map((t) => (
                  <tr
                    key={t.task_id}
                    onClick={() => setSel(t.task_id)}
                    className="cursor-pointer transition-colors"
                    style={{
                      backgroundColor: selected === t.task_id ? "var(--panel-2)" : undefined,
                    }}
                  >
                    <td className="px-3.5 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="font-mono text-sm" style={{ color: "var(--text)" }}>{t.task_id}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
                        ${t.amount.toFixed(0)} {t.currency} &middot; {t.merchant_name}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-right" style={{ borderBottom: "1px solid var(--border)" }}>
                      <StateBadge state={t.state} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        <div>
          {detail
            ? <TaskDetail detail={detail} />
            : (
              <div className="py-8 text-center rounded-lg border border-dashed" style={{ color: "var(--muted)", borderColor: "var(--border)" }}>
                Select a task to inspect.
              </div>
            )}
        </div>
      </div>
    </>
  );
}

function TaskDetail({ detail }) {
  const s = detail.snapshot;

  const KV = ({ label, children, mono }) => (
    <>
      <div className="text-sm py-1" style={{ color: "var(--muted)" }}>{label}</div>
      <div className={`text-sm py-1 ${mono ? "font-mono" : ""}`} style={{ color: "var(--text)" }}>
        {children}
      </div>
    </>
  );

  return (
    <>
      {/* Snapshot panel */}
      <div
        className="rounded-lg border p-4 mb-4"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
      >
        <h3 className="text-[11px] uppercase tracking-wide font-medium mb-3" style={{ color: "var(--muted)" }}>
          Snapshot — context_memory_service
        </h3>
        <div className="grid gap-x-3.5 gap-y-0" style={{ gridTemplateColumns: "160px 1fr" }}>
          <KV label="task_id" mono>{s.task_id}</KV>
          <KV label="state"><StateBadge state={s.state} /></KV>
          <KV label="amount">${s.amount.toFixed(2)} {s.currency}</KV>
          <KV label="merchant">{s.merchant_name} <span style={{ color: "var(--muted)" }}>({s.merchant_id})</span></KV>
          <KV label="sender → receiver" mono>{s.sender_wallet} → {s.receiver_wallet}</KV>
          <KV label="initiated_by">{s.initiated_by}</KV>
          <KV label="agent" mono>{s.agent}</KV>
          <KV label="token" mono>{s.token_id}</KV>
          <KV label="idempotency_key" mono>{s.idempotency_key}</KV>
          <KV label="approval_operator">{s.approval_operator || "—"}</KV>
          <KV label="beneficiary_status">{s.beneficiary_status || "—"}</KV>
          <KV label="rail_instruction_id" mono>{s.rail_instruction_id || "—"}</KV>
          <KV label="release_result" mono>{s.release_result || "—"}</KV>
          <KV label="liability_owner">{s.liability_owner}</KV>
          <KV label="updated_at"><span style={{ color: "var(--muted)" }}>{s.updated_at}</span></KV>
        </div>
      </div>

      {/* Delegated work */}
      {detail.delegations.length > 0 && (
        <div
          className="rounded-lg border p-4 mb-4"
          style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h3 className="text-[11px] uppercase tracking-wide font-medium mb-3" style={{ color: "var(--muted)" }}>
            Delegated Work
          </h3>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Work", "From → To", "Action", "Status", "Created"].map((h) => (
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
              {detail.delegations.map((d) => (
                <tr key={d.work_id} className="transition-colors hover:bg-[--panel-2]">
                  <td className="px-3 py-2 font-mono text-sm" style={{ borderBottom: "1px solid var(--border)" }}>{d.work_id}</td>
                  <td className="px-3 py-2 font-mono text-sm" style={{ borderBottom: "1px solid var(--border)" }}>{d.parent_agent} → {d.delegated_agent}</td>
                  <td className="px-3 py-2 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>{d.action}</td>
                  <td className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                    <StateBadge state={d.status === "completed" ? "settled" : d.status === "failed" ? "failed" : "awaiting_validation"} />
                  </td>
                  <td className="px-3 py-2 text-sm" style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>{d.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Provenance log */}
      <div
        className="rounded-lg border p-4"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
      >
        <h3 className="text-[11px] uppercase tracking-wide font-medium mb-3" style={{ color: "var(--muted)" }}>
          Provenance Log — provenance_service ({detail.provenance.length} records)
        </h3>
        <div className="flex flex-col gap-2">
          {detail.provenance.map((r) => (
            <ProvenanceRow key={r.record_id} record={r} />
          ))}
        </div>
      </div>
    </>
  );
}

function ProvenanceRow({ record }) {
  const ICON = { state_transition: "→", artifact: "◆", delegation: "⇢" }[record.record_type] || "·";
  const ICON_COLOR = {
    state_transition: "var(--accent-2)",
    artifact: "var(--warn)",
    delegation: "var(--accent)",
  }[record.record_type] || "var(--muted)";

  const d = record.data;

  let summary;
  if (record.record_type === "state_transition") {
    summary = (
      <>
        <span style={{ color: "var(--muted)" }}>{d.from_state || "—"}</span>
        {" → "}
        <strong>{d.to_state}</strong>
        {d.liability && <span style={{ color: "var(--muted)" }}> · liability: {d.liability}</span>}
      </>
    );
  } else if (record.record_type === "artifact") {
    if (d.artifact_type === "policy_decision") {
      summary = (
        <>
          <strong>policy:{d.decision}</strong>
          <span style={{ color: "var(--muted)" }}> · {d.reason}</span>
        </>
      );
    } else if (d.artifact_type === "capability_result") {
      summary = (
        <>
          <strong>{d.capability}</strong>
          <span style={{ color: "var(--muted)" }}> · outcome: {d.outcome}</span>
        </>
      );
    } else {
      summary = <span>{d.artifact_type}</span>;
    }
  } else if (record.record_type === "delegation") {
    summary = (
      <>
        <strong>{d.action}</strong>
        <span style={{ color: "var(--muted)" }}> · {d.delegated_to} · {d.status}</span>
      </>
    );
  } else {
    summary = <span>{record.record_type}</span>;
  }

  return (
    <div
      className="grid gap-2.5 px-2.5 py-2 rounded-md border items-start"
      style={{
        gridTemplateColumns: "80px 100px 1fr",
        backgroundColor: "var(--panel)",
        borderColor: "var(--border)",
      }}
    >
      <div>
        <span className="font-bold" style={{ color: ICON_COLOR }}>{ICON}</span>{" "}
        <span className="font-mono text-[11px]" style={{ color: "var(--muted)" }}>{record.record_type}</span>
      </div>
      <div>
        <div className="font-mono text-[11px]" style={{ color: "var(--muted)" }}>
          {record.created_at.slice(11)}
        </div>
        <div className="text-[10px]" style={{ color: "var(--muted)" }}>{record.actor_type}</div>
      </div>
      <div>
        <div className="text-sm">{summary}</div>
        <details className="mt-1">
          <summary className="cursor-pointer text-xs" style={{ color: "var(--muted)" }}>raw</summary>
          <pre
            className="mt-1.5 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap break-words font-mono"
            style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
          >
            {JSON.stringify(record, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
