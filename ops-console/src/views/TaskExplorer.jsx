import { useEffect, useState } from "react";
import { FiUser, FiCpu, FiZap } from "react-icons/fi";
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
        setSel((prev) => prev || (rows.length ? rows[0].task_id : null));
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

      {/* Agent graph */}
      <AgentFlowDiagram detail={detail} />

      {/* Flow diagram */}
      <FlowDiagram detail={detail} />

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

// ── Agent flow diagram ────────────────────────────────────────────────────────
// Connectors are drawn with calculated SVG — no DOM measurement, no refs,
// so the diagram re-renders purely from data whenever detail changes.

const AGENT_INFO = {
  "agent.payment_orchestrator": { label: "Payment Orchestrator", color: "var(--accent)",   role: "Parent Agent" },
  "agent.compliance_screening": { label: "Compliance Screening", color: "var(--accent-2)", role: "Specialist" },
  "agent.approval_router":      { label: "Approval Router",      color: "var(--warn)",     role: "Specialist" },
};

const NODE_W   = 148; // must match AgentCard width
const NODE_GAP = 32;  // gap-8
const CONN_H   = 48;  // height of each connector strip

function rowWidth(count) {
  return count * NODE_W + Math.max(0, count - 1) * NODE_GAP;
}

function AgentFlowDiagram({ detail }) {
  // Per-actor summary derived purely from provenance — updates on every render
  const actorSummary = {};
  detail.provenance.forEach((r) => {
    if (!r.actor) return;
    if (!actorSummary[r.actor]) actorSummary[r.actor] = { states: [], caps: [] };
    const a = actorSummary[r.actor];
    if (r.record_type === "state_transition" && r.data.to_state && !a.states.includes(r.data.to_state))
      a.states.push(r.data.to_state);
    if (r.record_type === "artifact" && r.data.artifact_type === "capability_result" && !a.caps.includes(r.data.capability))
      a.caps.push(r.data.capability);
  });

  // Unique parent and sub agents from delegations
  const seen = new Set();
  const delegEdges = [];
  detail.delegations.forEach((d) => {
    const key = `${d.parent_agent}→${d.delegated_agent}`;
    if (!seen.has(key)) { seen.add(key); delegEdges.push(d); }
  });
  const parentIds = [...new Set(delegEdges.map((d) => d.parent_agent))];
  const subIds    = [...new Set(delegEdges.map((d) => d.delegated_agent))];

  if (parentIds.length === 0) return null;

  const operatorId = detail.snapshot.approval_operator;

  // Layout widths — everything is centered around the widest row
  const subW    = rowWidth(Math.max(subIds.length, 1));
  const parentW = rowWidth(parentIds.length);
  const canvasW = Math.max(subW, parentW, NODE_W);

  // Center offsets so both rows sit over the canvas center
  const parentOffset = (canvasW - parentW) / 2;
  const subOffset    = (canvasW - subW) / 2;

  // Center X of a node in its row
  const cx = (offset, i) => offset + i * (NODE_W + NODE_GAP) + NODE_W / 2;

  // Parent row centers (for root→parent drop)
  const parentCenters = parentIds.map((_, i) => cx(parentOffset, i));
  const rootCx = canvasW / 2;

  // Sub-agent delegations per parent (maps parent id → [sub ids in order])
  const parentToSubs = {};
  delegEdges.forEach((d) => {
    if (!parentToSubs[d.parent_agent]) parentToSubs[d.parent_agent] = [];
    if (!parentToSubs[d.parent_agent].includes(d.delegated_agent))
      parentToSubs[d.parent_agent].push(d.delegated_agent);
  });

  return (
    <div className="rounded-lg border p-4 mb-4" style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}>
      <h3 className="text-[11px] uppercase tracking-wide font-medium mb-1" style={{ color: "var(--muted)" }}>
        Agent Flow
      </h3>
      <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
        Who acted, what they did, and who they delegated to.
      </p>

      <div className="rounded-xl border-2 border-dashed p-6 overflow-x-auto" style={{ borderColor: "var(--border)" }}>
        <div className="flex flex-col items-center" style={{ minWidth: canvasW }}>

          {/* Row 0 — Root / operator */}
          <AgentCard icon={<FiUser size={20} />}
            label={operatorId || "Root Authority"}
            role={operatorId ? "Human Operator" : "Authorization Issuer"}
            color="var(--success)"
            summary={operatorId ? actorSummary[operatorId] : null}
            currentState={detail.snapshot.state} />

          {/* Root → parent connector */}
          <svg width={canvasW} height={CONN_H} style={{ display: "block", flexShrink: 0 }}>
            {parentCenters.map((pcx, i) => (
              <g key={i}>
                {/* vertical drop from root center */}
                <line x1={rootCx} y1={0} x2={rootCx} y2={CONN_H / 2}
                  stroke="var(--border)" strokeWidth={1.5} strokeDasharray="5 3" />
                {/* horizontal leg to this parent (only if off-center) */}
                {pcx !== rootCx && (
                  <line x1={rootCx} y1={CONN_H / 2} x2={pcx} y2={CONN_H / 2}
                    stroke="var(--border)" strokeWidth={1.5} strokeDasharray="5 3" />
                )}
                {/* drop to parent node */}
                <line x1={pcx} y1={CONN_H / 2} x2={pcx} y2={CONN_H}
                  stroke="var(--border)" strokeWidth={1.5} strokeDasharray="5 3" />
                <circle cx={pcx} cy={CONN_H} r={3} fill="var(--accent)" />
              </g>
            ))}
          </svg>

          {/* Row 1 — Parent agents */}
          <div className="flex" style={{ gap: NODE_GAP, marginLeft: parentOffset, marginRight: parentOffset }}>
            {parentIds.map((id) => {
              const info = AGENT_INFO[id] || { label: id, color: "var(--muted)", role: "Agent" };
              return (
                <AgentCard key={id} icon={<FiCpu size={20} />}
                  label={info.label} role={info.role} color={info.color}
                  summary={actorSummary[id]}
                  currentState={detail.snapshot.state} />
              );
            })}
          </div>

          {/* Parent → sub connector */}
          {subIds.length > 0 && (() => {
            // For each parent, draw lines to its subs
            const lines = [];
            parentIds.forEach((pid, pi) => {
              const mySubs = parentToSubs[pid] || [];
              const pcx = cx(parentOffset, pi);
              mySubs.forEach((sid) => {
                const si = subIds.indexOf(sid);
                const scx = cx(subOffset, si);
                const midY = CONN_H / 2;
                lines.push(
                  <g key={`${pid}-${sid}`}>
                    <line x1={pcx} y1={0} x2={pcx} y2={midY}
                      stroke="var(--border)" strokeWidth={1.5} strokeDasharray="5 3" />
                    <line x1={pcx} y1={midY} x2={scx} y2={midY}
                      stroke="var(--border)" strokeWidth={1.5} strokeDasharray="5 3" />
                    <line x1={scx} y1={midY} x2={scx} y2={CONN_H}
                      stroke="var(--border)" strokeWidth={1.5} strokeDasharray="5 3" />
                    <circle cx={scx} cy={CONN_H} r={3} fill="var(--accent)" />
                    {/* edge label */}
                    {delegEdges.find(d => d.parent_agent === pid && d.delegated_agent === sid)?.action && (
                      <text x={(pcx + scx) / 2 + 4} y={midY - 3} fontSize="9"
                        fill="var(--muted)" textAnchor="middle">
                        {delegEdges.find(d => d.parent_agent === pid && d.delegated_agent === sid).action.replace(/_/g, " ")}
                      </text>
                    )}
                  </g>
                );
              });
            });
            return (
              <svg width={canvasW} height={CONN_H} style={{ display: "block", flexShrink: 0 }}>
                {lines}
              </svg>
            );
          })()}

          {/* Row 2 — Specialist agents */}
          {subIds.length > 0 && (
            <div className="flex" style={{ gap: NODE_GAP, marginLeft: subOffset, marginRight: subOffset }}>
              {subIds.map((id) => {
                const info = AGENT_INFO[id] || { label: id, color: "var(--muted)", role: "Specialist" };
                return (
                  <AgentCard key={id} icon={<FiZap size={18} />}
                    label={info.label} role={info.role} color={info.color}
                    summary={actorSummary[id]}
                    currentState={detail.snapshot.state} />
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const CARD_STATE_COLOR = {
  received: "var(--muted)", awaiting_validation: "var(--accent)",
  awaiting_approval: "var(--warn)", approved: "var(--success)",
  releasing: "var(--accent)", settlement_pending: "var(--accent-2)",
  pending_reconcile: "var(--warn)", settled: "var(--success)",
  failed: "var(--danger)", exception: "var(--danger)",
};

function AgentCard({ icon, label, role, color, summary, currentState }) {
  return (
    <div
      className="rounded-xl border p-3 flex flex-col items-center text-center"
      style={{ backgroundColor: "var(--panel-2)", borderColor: color, width: "148px" }}
    >
      {/* Icon circle */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
        style={{ backgroundColor: "var(--panel)", border: `2px solid ${color}`, color }}
      >
        {icon}
      </div>

      {/* Name */}
      <div className="text-xs font-semibold leading-tight mb-1" style={{ color: "var(--text)" }}>
        {label}
      </div>

      {/* Role badge */}
      <div
        className="text-[10px] px-2 py-0.5 rounded-full font-medium mb-2"
        style={{ color, border: `1px solid ${color}` }}
      >
        {role}
      </div>

      {/* Actions summary */}
      {summary && (summary.states.length > 0 || summary.caps.length > 0) && (
        <div className="w-full border-t pt-2 space-y-0.5 text-left" style={{ borderColor: "var(--border)" }}>
          {summary.states.map((s) => {
            const isCurrent = s === currentState;
            const stateColor = CARD_STATE_COLOR[s] || "var(--muted)";
            return (
              <div key={s} className="text-[10px] font-mono truncate"
                style={{
                  color: isCurrent ? stateColor : "var(--muted)",
                  opacity: isCurrent ? 1 : 0.55,
                  textDecoration: isCurrent ? "none" : "line-through",
                }}
                title={isCurrent ? "Current task state" : "Completed — task has moved on"}
              >
                {isCurrent ? "●" : "✓"} {s.replace(/_/g, " ")}
              </div>
            );
          })}
          {summary.caps.map((c) => (
            <div key={c} className="text-[10px] font-mono truncate" style={{ color: "var(--accent)" }}>
              ◆ {c.replace(/_/g, " ")}
            </div>
          ))}
          {/* Show "work complete" when agent has no current-state involvement */}
          {summary.states.length > 0 && summary.states.every((s) => s !== currentState) && (
            <div className="mt-1.5 pt-1.5 border-t text-center text-[10px] font-medium"
              style={{ borderColor: "var(--border)", color: "var(--success)" }}>
              ✓ work complete
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Flow diagram ─────────────────────────────────────────────────────────────

const AGENT_META = {
  "agent.payment_orchestrator": { label: "Orchestrator",      color: "var(--accent)" },
  "agent.compliance_screening": { label: "Compliance Agent",  color: "var(--accent-2)" },
  "agent.approval_router":      { label: "Approval Router",   color: "var(--warn)" },
};

const STATE_COLOR = {
  received:            "var(--muted)",
  awaiting_validation: "var(--accent)",
  awaiting_approval:   "var(--warn)",
  approved:            "var(--success)",
  releasing:           "var(--accent)",
  settlement_pending:  "var(--accent-2)",
  pending_reconcile:   "var(--warn)",
  settled:             "var(--success)",
  failed:              "var(--danger)",
  exception:           "var(--danger)",
};

function actorColor(actor, actorType) {
  if (actorType === "operator") return "var(--success)";
  return AGENT_META[actor]?.color || "var(--muted)";
}

function actorLabel(actor, actorType) {
  if (actorType === "operator") return `Operator (${actor})`;
  return AGENT_META[actor]?.label || actor;
}

function FlowDiagram({ detail }) {
  const records = [...detail.provenance].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );

  // Build ordered list of visited states from transitions
  const visitedStates = [];
  records
    .filter((r) => r.record_type === "state_transition")
    .forEach((r) => {
      if (r.data.from_state && !visitedStates.includes(r.data.from_state))
        visitedStates.push(r.data.from_state);
      if (!visitedStates.includes(r.data.to_state))
        visitedStates.push(r.data.to_state);
    });

  // Collect unique agents that appeared
  const agents = {};
  records.forEach((r) => {
    if (r.actor && r.actor_type !== "system" && !agents[r.actor]) {
      agents[r.actor] = { color: actorColor(r.actor, r.actor_type), label: actorLabel(r.actor, r.actor_type) };
    }
  });

  const isFailed = ["failed", "exception"].includes(detail.snapshot.state);

  return (
    <div
      className="rounded-lg border p-4 mb-4"
      style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
    >
      <h3
        className="text-[11px] uppercase tracking-wide font-medium mb-4"
        style={{ color: "var(--muted)" }}
      >
        Transaction Flow
      </h3>

      {/* State ribbon */}
      <div className="overflow-x-auto mb-4 pb-1">
        <div className="flex items-center min-w-max">
          {visitedStates.map((state, i) => {
            const color = STATE_COLOR[state] || "var(--muted)";
            const isLast = i === visitedStates.length - 1;
            return (
              <div key={state} className="flex items-center">
                <div
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap"
                  style={{
                    border: `1px solid ${color}`,
                    color,
                    backgroundColor: isLast ? `color-mix(in srgb, ${color} 12%, transparent)` : "var(--panel-2)",
                  }}
                >
                  {state.replace(/_/g, " ")}
                </div>
                {!isLast && (
                  <div className="px-1.5 text-sm" style={{ color: "var(--border)" }}>›</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent participants */}
      {Object.keys(agents).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {Object.entries(agents).map(([actor, info]) => (
            <div
              key={actor}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px]"
              style={{ border: `1px solid ${info.color}`, color: info.color, backgroundColor: "var(--panel-2)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: info.color }} />
              {info.label}
            </div>
          ))}
        </div>
      )}

      {/* Vertical timeline */}
      <div className="relative">
        <div
          className="absolute top-5 bottom-5 w-px"
          style={{ left: "19px", backgroundColor: "var(--border)" }}
        />
        <div className="flex flex-col gap-2.5">
          {records.map((r) => {
            if (r.record_type === "state_transition") {
              const color = STATE_COLOR[r.data.to_state] || "var(--muted)";
              const aColor = actorColor(r.actor, r.actor_type);
              return (
                <div key={r.record_id} className="flex gap-3 items-start">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0 z-10"
                    style={{ backgroundColor: "var(--panel-2)", border: `2px solid ${color}`, color }}
                  >
                    →
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color }}>
                        {r.data.to_state?.replace(/_/g, " ")}
                      </span>
                      {r.data.from_state && (
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                          from {r.data.from_state.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: aColor }} />
                      <span className="text-xs" style={{ color: aColor }}>{actorLabel(r.actor, r.actor_type)}</span>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>· {r.created_at.slice(11, 19)}</span>
                      {r.data.liability && (
                        <span className="text-xs" style={{ color: "var(--muted)" }}>· liability: {r.data.liability}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            if (r.record_type === "artifact") {
              const d = r.data;
              let icon, label, sub, dotColor;
              if (d.artifact_type === "policy_decision") {
                const allow = d.decision === "allow";
                dotColor = allow ? "var(--success)" : "var(--danger)";
                icon = allow ? "✓" : "✗";
                label = `Policy: ${d.decision.toUpperCase()}`;
                sub = d.reason;
              } else if (d.artifact_type === "capability_result") {
                const ok = d.outcome === "success";
                dotColor = ok ? "var(--accent)" : "var(--danger)";
                icon = "◆";
                label = d.capability?.replace(/_/g, " ");
                sub = `outcome: ${d.outcome}`;
              } else {
                dotColor = "var(--muted)";
                icon = "·";
                label = d.artifact_type;
                sub = null;
              }
              const aColor = actorColor(r.actor, r.actor_type);
              return (
                <div key={r.record_id} className="flex gap-3 items-start">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10"
                    style={{ backgroundColor: "var(--panel-2)", border: `1px solid ${dotColor}`, color: dotColor }}
                  >
                    {icon}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="text-sm font-medium" style={{ color: dotColor }}>{label}</div>
                    {sub && <div className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--muted)" }}>{sub}</div>}
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: aColor }} />
                      <span className="text-xs" style={{ color: aColor }}>{actorLabel(r.actor, r.actor_type)}</span>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>· {r.created_at.slice(11, 19)}</span>
                    </div>
                  </div>
                </div>
              );
            }

            if (r.record_type === "delegation") {
              const d = r.data;
              const isPending = d.status === "pending";
              const dotColor = isPending ? "var(--warn)" : d.status === "completed" ? "var(--accent)" : "var(--danger)";
              const aColor = actorColor(r.actor, r.actor_type);
              return (
                <div key={r.record_id} className="flex gap-3 items-start">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0 z-10"
                    style={{ backgroundColor: "var(--panel-2)", border: `1px solid ${dotColor}`, color: dotColor }}
                  >
                    ⇢
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="text-sm font-medium" style={{ color: dotColor }}>
                      {isPending ? "Delegated" : `Delegation ${d.status}`}: {d.action?.replace(/_/g, " ")}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {isPending
                        ? `${actorLabel(r.actor, r.actor_type)} → ${actorLabel(d.delegated_to, "agent")}`
                        : `completed by ${actorLabel(r.actor, r.actor_type)}`}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: aColor }} />
                      <span className="text-xs" style={{ color: aColor }}>{actorLabel(r.actor, r.actor_type)}</span>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>· {r.created_at.slice(11, 19)}</span>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
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
