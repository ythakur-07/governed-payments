import { useEffect, useState } from "react";
import { api } from "../api.js";
import AuthorityBar from "../components/AuthorityBar.jsx";

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
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Trust Graph</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            Delegation chain: Root &rarr; Principal &rarr; Parent Agent &rarr; Sub-Agent &rarr; Tool.
            Authority bars reflect each token's spent vs spend_limit (Article 3 / MDP).
          </p>
        </div>
      </div>

      {/* Tree */}
      <div className="flex flex-col gap-3">
        {/* Root node */}
        <div
          className="rounded-lg p-3.5 border"
          style={{ backgroundColor: "var(--panel)", borderColor: "var(--accent-2)" }}
        >
          <h4 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{graph.root.label}</h4>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>root authorization issuer</p>
        </div>

        {/* Principals */}
        <div className="ml-6 flex flex-col gap-2.5 border-l border-dashed pl-5" style={{ borderColor: "var(--border)" }}>
          {graph.principals.map((p) => (
            <div
              key={p.id}
              className="rounded-lg p-3.5 border"
              style={{ backgroundColor: "var(--panel)", borderColor: "var(--accent)" }}
            >
              <h4 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{p.label}</h4>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                principal — holds {p.tokens.length} delegation token(s)
              </p>
              {p.tokens.map((tok) => (
                <AuthorityBar key={tok.token_id} token={tok} />
              ))}

              {/* Parent Agents */}
              <div className="ml-6 mt-3 flex flex-col gap-2.5 border-l border-dashed pl-5" style={{ borderColor: "var(--border)" }}>
                {graph.parent_agents.map((pa) => (
                  <ParentAgentNode key={pa.agent_id} agent={pa} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ParentAgentNode({ agent }) {
  return (
    <div
      className="rounded-lg p-3.5 border"
      style={{ backgroundColor: "var(--panel)", borderColor: "var(--warn)" }}
    >
      <h4 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{agent.agent_id}</h4>
      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{agent.description}</p>
      <ToolsRow tools={agent.tools} />

      {/* Sub-agents */}
      <div className="ml-6 mt-3 flex flex-col gap-2.5 border-l border-dashed pl-5" style={{ borderColor: "var(--border)" }}>
        {agent.sub_agents.map((sa) => (
          <div
            key={sa.agent_id}
            className="rounded-lg p-3.5 border"
            style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
          >
            <h4 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{sa.agent_id}</h4>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{sa.description}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>scope: {sa.actions.join(", ")}</p>
            <ToolsRow tools={sa.tools} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolsRow({ tools }) {
  if (!tools || tools.length === 0) {
    return <p className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>(no tools — routing only)</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {tools.map((t) => (
        <span
          key={t.name}
          className="text-[11px] px-2 py-0.5 rounded-full border"
          style={{
            color: t.has_side_effect ? "var(--danger)" : "var(--muted)",
            borderColor: t.has_side_effect ? "var(--danger)" : "var(--border)",
            backgroundColor: "var(--panel-2)",
          }}
          title={`${t.type} · ${t.has_side_effect ? "has side effect" : "no side effect"} · ${t.idempotent ? "idempotent" : "non-idempotent"}`}
        >
          {t.name}
          {t.has_side_effect ? " ⚠" : ""}
        </span>
      ))}
    </div>
  );
}
