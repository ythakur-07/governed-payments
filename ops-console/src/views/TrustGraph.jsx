import { useEffect, useState } from "react";
import { api } from "../api.js";
import AuthorityBar from "../components/AuthorityBar.jsx";

const CAPABILITY_DESCRIPTIONS = {
  create_instruction:  "Drafts a payment instruction — no money moves yet.",
  validate_beneficiary: "Checks the receiving account is eligible. Read-only.",
  release_payment:     "Sends the actual payment. Irreversible once executed.",
  get_status:          "Queries current payment status. Read-only.",
};

const AGENT_ROLES = {
  "agent.payment_orchestrator": "Payment Orchestrator",
  "agent.compliance_screening": "Compliance Screening",
  "agent.approval_router":      "Approval Router",
};

export default function TrustGraph() {
  const [graph, setGraph] = useState(null);
  const [error, setError] = useState(null);

  const load = () =>
    api.trustGraph()
      .then(setGraph)
      .catch((e) => setError(String(e)));

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    const onRefresh = () => load();
    window.addEventListener("ops:refresh", onRefresh);
    return () => {
      clearInterval(t);
      window.removeEventListener("ops:refresh", onRefresh);
    };
  }, []);

  if (error) {
    return (
      <div className="px-4 py-3 rounded-lg border" style={{ borderColor: "var(--danger)", background: "rgba(248,113,113,0.08)", color: "var(--danger)" }}>
        {error}
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="py-8 text-center rounded-lg border border-dashed" style={{ color: "var(--muted)", borderColor: "var(--border)" }}>
        Loading trust graph...
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>Trust Graph</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Shows who authorized whom to spend money, and how much authority each level carries.
        </p>
      </div>

      {/* Explainer */}
      <div
        className="rounded-lg border p-5 mb-6"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--accent-2)" }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--accent-2)" }}>
          How delegation works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
          <div>
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>What is a delegation token?</p>
            <p>
              Think of it like a corporate credit card with rules baked in: the token specifies exactly
              how much the agent can spend, in which currency, at which merchants, and for how long.
              The agent cannot change these limits — only the operator who issued the token can.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Why does the chain matter?</p>
            <p>
              Authority flows strictly downward. A parent agent can carve out a portion of its authority
              and delegate it to a specialist agent — but it can never grant more than it received.
              Revoking a token at any level instantly cuts off everything below it.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>What does "revoked" mean?</p>
            <p>
              A revoked token is permanently disabled. The agent holding it cannot take any action,
              even for amounts it would otherwise be allowed to spend. Revocation is immediate and
              system-wide — no payment can slip through after revocation.
            </p>
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="flex flex-col gap-4">
        {/* Root node */}
        <NodeCard
          borderColor="var(--accent-2)"
          badge="Root Authority"
          badgeColor="var(--accent-2)"
          title={graph.root.label}
          subtitle="The human operator. Sets the total budget and rules. Cannot be overridden by any agent."
          mono={graph.root.id}
        />

        {/* Principals */}
        <div className="ml-6 flex flex-col gap-3 border-l-2 pl-5" style={{ borderColor: "var(--accent-2)" }}>
          <div className="text-[11px] uppercase tracking-widest font-medium -ml-1 mb-1" style={{ color: "var(--accent-2)" }}>
            ↳ Delegated Principal
          </div>
          {graph.principals.map((p) => (
            <div key={p.id}>
              <NodeCard
                borderColor="var(--accent)"
                badge="Principal"
                badgeColor="var(--accent)"
                title={p.label}
                subtitle={`Top-level agent. Receives authority from the root and may sub-delegate to specialist agents. Holds ${p.tokens.length} delegation token(s).`}
                mono={p.id}
              />

              {/* Delegation tokens */}
              <div className="mt-3 ml-6 flex flex-col gap-2 border-l-2 pl-5" style={{ borderColor: "var(--accent)" }}>
                <div className="text-[11px] uppercase tracking-widest font-medium -ml-1 mb-1" style={{ color: "var(--accent)" }}>
                  ↳ Delegation Tokens
                </div>
                {p.tokens.map((tok) => (
                  <AuthorityBar key={tok.token_id} token={tok} />
                ))}
              </div>

              {/* Parent Agents */}
              <div className="mt-3 ml-6 flex flex-col gap-3 border-l-2 pl-5" style={{ borderColor: "var(--warn)" }}>
                <div className="text-[11px] uppercase tracking-widest font-medium -ml-1 mb-1" style={{ color: "var(--warn)" }}>
                  ↳ Agents
                </div>
                {graph.parent_agents.map((pa) => (
                  <ParentAgentNode key={pa.agent_id} agent={pa} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div
        className="mt-8 rounded-lg border p-4"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
      >
        <h4 className="text-[11px] uppercase tracking-wide font-medium mb-3" style={{ color: "var(--muted)" }}>
          Legend
        </h4>
        <div className="flex flex-wrap gap-4 text-xs" style={{ color: "var(--muted)" }}>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "var(--success)" }} />
            Active token — agent can spend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "var(--danger)" }} />
            Revoked token — agent is blocked
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "var(--danger)", opacity: 0.5 }} />
            Capability with side effects (money moves)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "var(--muted)", opacity: 0.5 }} />
            Read-only capability (no money moves)
          </div>
        </div>
      </div>
    </>
  );
}

function NodeCard({ borderColor, badge, badgeColor, title, subtitle, mono }) {
  return (
    <div
      className="rounded-lg p-4 border"
      style={{ backgroundColor: "var(--panel)", borderColor }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
              style={{ color: badgeColor, border: `1px solid ${badgeColor}` }}
            >
              {badge}
            </span>
          </div>
          <h4 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{title}</h4>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>{subtitle}</p>
        </div>
        {mono && (
          <span className="font-mono text-[10px] shrink-0" style={{ color: "var(--muted)" }}>{mono}</span>
        )}
      </div>
    </div>
  );
}

function ParentAgentNode({ agent }) {
  const friendlyName = AGENT_ROLES[agent.agent_id] || agent.agent_id;
  const allCapabilityNames = Object.keys(CAPABILITY_DESCRIPTIONS);
  const grantedNames = agent.tools.map((t) => t.name);
  const blockedNames = allCapabilityNames.filter((n) => !grantedNames.includes(n));

  return (
    <div
      className="rounded-lg p-4 border"
      style={{ backgroundColor: "var(--panel)", borderColor: "var(--warn)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
              style={{ color: "var(--warn)", border: "1px solid var(--warn)" }}
            >
              Parent Agent
            </span>
          </div>
          <h4 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{friendlyName}</h4>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--muted)" }}>{agent.description}</p>
        </div>
        <span className="font-mono text-[10px] shrink-0" style={{ color: "var(--muted)" }}>{agent.agent_id}</span>
      </div>

      {/* Capabilities breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div
          className="rounded-md p-3"
          style={{ backgroundColor: "var(--panel-2)", border: "1px solid var(--border)" }}
        >
          <div className="text-[10px] uppercase tracking-wide font-medium mb-2" style={{ color: "var(--success)" }}>
            Can perform
          </div>
          <div className="flex flex-col gap-1.5">
            {agent.tools.length === 0 ? (
              <span className="text-xs" style={{ color: "var(--muted)" }}>Routing only — no direct rail access</span>
            ) : (
              agent.tools.map((t) => (
                <div key={t.name} className="flex items-start gap-2">
                  <span
                    className="mt-0.5 text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0"
                    style={{
                      color: t.has_side_effect ? "var(--danger)" : "var(--muted)",
                      border: `1px solid ${t.has_side_effect ? "var(--danger)" : "var(--border)"}`,
                      backgroundColor: "var(--panel)",
                    }}
                  >
                    {t.name}
                    {t.has_side_effect ? " ⚠" : ""}
                  </span>
                  <span className="text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
                    {CAPABILITY_DESCRIPTIONS[t.name] || t.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          className="rounded-md p-3"
          style={{ backgroundColor: "var(--panel-2)", border: "1px solid var(--border)" }}
        >
          <div className="text-[10px] uppercase tracking-wide font-medium mb-2" style={{ color: "var(--muted)" }}>
            Cannot perform
          </div>
          <div className="flex flex-col gap-1.5">
            {blockedNames.length === 0 ? (
              <span className="text-xs" style={{ color: "var(--muted)" }}>No restrictions</span>
            ) : (
              blockedNames.map((name) => (
                <div key={name} className="flex items-start gap-2">
                  <span
                    className="mt-0.5 text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0"
                    style={{ color: "var(--muted)", border: "1px solid var(--border)", backgroundColor: "var(--panel)" }}
                  >
                    {name}
                  </span>
                  <span className="text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
                    {CAPABILITY_DESCRIPTIONS[name]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sub-agents */}
      {agent.sub_agents.length > 0 && (
        <div className="border-l-2 pl-4 ml-2 flex flex-col gap-2.5" style={{ borderColor: "var(--border)" }}>
          <div className="text-[11px] uppercase tracking-widest font-medium -ml-1 mb-1" style={{ color: "var(--muted)" }}>
            ↳ Specialist Agents
          </div>
          {agent.sub_agents.map((sa) => (
            <SubAgentNode key={sa.agent_id} agent={sa} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubAgentNode({ agent }) {
  const friendlyName = AGENT_ROLES[agent.agent_id] || agent.agent_id;
  const allCapabilityNames = Object.keys(CAPABILITY_DESCRIPTIONS);
  const grantedNames = agent.tools.map((t) => t.name);
  const blockedNames = allCapabilityNames.filter((n) => !grantedNames.includes(n));

  return (
    <div
      className="rounded-lg p-3.5 border"
      style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
              style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
            >
              Specialist Agent
            </span>
          </div>
          <h5 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{friendlyName}</h5>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--muted)" }}>{agent.description}</p>
        </div>
        <span className="font-mono text-[10px] shrink-0" style={{ color: "var(--muted)" }}>{agent.agent_id}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-md p-2.5" style={{ backgroundColor: "var(--panel-2)", border: "1px solid var(--border)" }}>
          <div className="text-[10px] uppercase tracking-wide font-medium mb-1.5" style={{ color: "var(--success)" }}>Can perform</div>
          {agent.tools.length === 0 ? (
            <span className="text-[11px]" style={{ color: "var(--muted)" }}>Routing only</span>
          ) : (
            agent.tools.map((t) => (
              <div key={t.name} className="flex items-start gap-1.5 mb-1">
                <span className="font-mono text-[10px] shrink-0" style={{ color: t.has_side_effect ? "var(--danger)" : "var(--muted)" }}>
                  {t.name}{t.has_side_effect ? " ⚠" : ""}
                </span>
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                  — {CAPABILITY_DESCRIPTIONS[t.name] || t.type}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="rounded-md p-2.5" style={{ backgroundColor: "var(--panel-2)", border: "1px solid var(--border)" }}>
          <div className="text-[10px] uppercase tracking-wide font-medium mb-1.5" style={{ color: "var(--muted)" }}>Cannot perform</div>
          {blockedNames.length === 0 ? (
            <span className="text-[11px]" style={{ color: "var(--muted)" }}>No restrictions</span>
          ) : (
            blockedNames.map((name) => (
              <div key={name} className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>
                <span className="font-mono">{name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
