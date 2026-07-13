import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { COMPONENTS, BY_KEY } from "./data/architecture.js";

// The request path, used to derive each node's incoming/outgoing neighbours
// so hovering a component can trace its data flows. The Audit Engine is
// cross-cutting: it connects to every governance component rather than
// sitting in the linear path.
const LINEAR = [
  "ai-agent",
  "merchant",
  "intent-engine",
  "delegation-manager",
  "policy-engine",
  "risk-engine",
  "payment-orchestrator",
  "wallet",
  "network",
  "issuer",
];

const GOV_ENGINES = [
  "intent-engine",
  "delegation-manager",
  "policy-engine",
  "risk-engine",
  "payment-orchestrator",
];

function neighbours(key) {
  const set = new Set();
  const i = LINEAR.indexOf(key);
  if (i > 0) set.add(LINEAR[i - 1]);
  if (i >= 0 && i < LINEAR.length - 1) set.add(LINEAR[i + 1]);
  if (key === "audit-engine") GOV_ENGINES.forEach((k) => set.add(k));
  if (GOV_ENGINES.includes(key)) set.add("audit-engine");
  return set;
}

const ZONE_META = {
  untrusted: { color: "var(--gp-danger)", label: "Untrusted", note: "Assertions, never authority" },
  "control-plane": { color: "var(--gp-accent)", label: "Control Plane", note: "The governance boundary" },
  rails: { color: "var(--gp-faint)", label: "Payment rails", note: "Existing infrastructure" },
};

function Node({ c, state, onSelect, onHover }) {
  // state: "selected" | "hovered" | "neighbour" | "dim" | "idle"
  const gov = c.governance;
  const emphasised = state === "selected" || state === "hovered" || state === "neighbour";
  const borderColor = emphasised
    ? "var(--gp-accent)"
    : gov
    ? "var(--gp-border-strong)"
    : "var(--gp-border)";
  return (
    <button
      onClick={() => onSelect(c.key)}
      onMouseEnter={() => onHover(c.key)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(c.key)}
      onBlur={() => onHover(null)}
      aria-pressed={state === "selected"}
      className={`relative w-full text-left rounded-lg px-4 py-2.5 transition-all ${
        state === "hovered" ? "gp-node-glow" : ""
      }`}
      style={{
        backgroundColor: gov ? "var(--gp-panel)" : "var(--gp-bg-subtle)",
        border: `1px solid ${borderColor}`,
        opacity: state === "dim" ? 0.4 : 1,
        boxShadow: state === "selected" ? "0 0 0 1px var(--gp-accent)" : "none",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold" style={{ color: "var(--gp-text)" }}>
          {c.name}
        </span>
        <span
          className="text-[11px] shrink-0"
          style={{ color: emphasised ? "var(--gp-accent)" : "var(--gp-faint)" }}
        >
          {c.layer}
        </span>
      </div>
    </button>
  );
}

// A vertical connector between two stacked nodes. Animates when either
// endpoint is the hovered node.
function DownArrow({ active }) {
  return (
    <div
      className={`py-1 text-lg leading-none ${active ? "gp-flow-down" : ""}`}
      style={{ color: active ? "var(--gp-accent)" : "var(--gp-faint)" }}
      aria-hidden="true"
    >
      ↓
    </div>
  );
}

function Field({ label, children, mono }) {
  return (
    <div className="mt-4">
      <div className="gp-eyebrow mb-1" style={{ color: "var(--gp-faint)" }}>
        {label}
      </div>
      <div
        className="text-sm leading-relaxed"
        style={{ color: "var(--gp-text-2)", fontFamily: mono ? "var(--gp-mono)" : "inherit" }}
      >
        {children}
      </div>
    </div>
  );
}

function LegendDot({ zone }) {
  const m = ZONE_META[zone];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--gp-muted)" }}>
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
      {m.label}
    </span>
  );
}

export default function ArchitectureExplorer() {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const panelRef = useRef(null);

  const item = selected ? BY_KEY[selected] : null;
  const nbrs = useMemo(() => (hovered ? neighbours(hovered) : new Set()), [hovered]);

  // On narrow screens the panel sits below the diagram — bring it into view
  // when a component is selected.
  useEffect(() => {
    if (!selected) return;
    if (window.matchMedia("(max-width: 1023px)").matches && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selected]);

  function nodeState(key) {
    if (hovered) {
      if (key === hovered) return "hovered";
      if (nbrs.has(key)) return "neighbour";
      return "dim";
    }
    if (key === selected) return "selected";
    return "idle";
  }

  // A vertical connector is "flowing" when the hovered node is one of the two
  // components it joins.
  const arrowActive = (a, b) => hovered === a || hovered === b;

  const untrusted = COMPONENTS.filter((c) => c.zone === "untrusted");
  const rails = COMPONENTS.filter((c) => c.zone === "rails");
  const engines = GOV_ENGINES.map((k) => BY_KEY[k]);
  const audit = BY_KEY["audit-engine"];

  const nodeProps = { onSelect: setSelected, onHover: setHovered };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Header */}
      <header className="max-w-3xl mb-10">
        <div className="gp-eyebrow mb-4">Architecture Explorer</div>
        <h1 className="gp-display text-4xl sm:text-5xl mb-6" style={{ color: "var(--gp-text)" }}>
          Explore the Control Plane
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: "var(--gp-text-2)" }}>
          Every payment request crosses from untrusted actors, through the governance boundary,
          and only then reaches the rails. Select any component to read its contract; hover to
          trace the data flowing in and out.
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">
        {/* Diagram */}
        <div
          className="rounded-2xl p-5 sm:p-8"
          style={{ backgroundColor: "var(--gp-bg-subtle)", border: "1px solid var(--gp-border)" }}
        >
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <LegendDot zone="untrusted" />
            <LegendDot zone="control-plane" />
            <LegendDot zone="rails" />
          </div>

          <div className="flex flex-col items-stretch max-w-md mx-auto">
            {/* Untrusted zone */}
            <ZoneBox zone="untrusted">
              {untrusted.map((c, i) => (
                <div key={c.key}>
                  <Node c={c} state={nodeState(c.key)} {...nodeProps} />
                  {i < untrusted.length - 1 && (
                    <DownArrow active={arrowActive(c.key, untrusted[i + 1].key)} />
                  )}
                </div>
              ))}
            </ZoneBox>

            <DownArrow active={arrowActive("merchant", "intent-engine")} />

            {/* Control Plane zone */}
            <ZoneBox zone="control-plane">
              {engines.map((c, i) => (
                <div key={c.key}>
                  <Node c={c} state={nodeState(c.key)} {...nodeProps} />
                  {i < engines.length - 1 && (
                    <DownArrow active={arrowActive(c.key, engines[i + 1].key)} />
                  )}
                </div>
              ))}

              {/* Audit Engine — cross-cutting, records every decision */}
              <div
                className="mt-4 pt-4"
                style={{ borderTop: "1px dashed var(--gp-border-strong)" }}
              >
                <Node c={audit} state={nodeState("audit-engine")} {...nodeProps} />
                <p className="text-[11px] mt-1.5 text-center" style={{ color: "var(--gp-faint)" }}>
                  Cross-cutting — records every decision above
                </p>
              </div>
            </ZoneBox>

            <DownArrow active={arrowActive("payment-orchestrator", "wallet")} />

            {/* Rails zone */}
            <ZoneBox zone="rails">
              {rails.map((c, i) => (
                <div key={c.key}>
                  <Node c={c} state={nodeState(c.key)} {...nodeProps} />
                  {i < rails.length - 1 && (
                    <DownArrow active={arrowActive(c.key, rails[i + 1].key)} />
                  )}
                </div>
              ))}
            </ZoneBox>
          </div>
        </div>

        {/* Side panel */}
        <aside ref={panelRef} className="mt-6 lg:mt-0 scroll-mt-24">
          <div className="lg:sticky lg:top-24">
            {item ? (
              <div
                key={item.key}
                className="gp-fade-in rounded-2xl p-6"
                style={{ backgroundColor: "var(--gp-panel)", border: "1px solid var(--gp-border)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: ZONE_META[item.zone].color }}
                  />
                  <span className="gp-eyebrow" style={{ color: "var(--gp-faint)" }}>
                    {item.layer}
                  </span>
                </div>
                <h2 className="gp-display text-2xl mb-2" style={{ color: "var(--gp-text)" }}>
                  {item.name}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "var(--gp-text-2)" }}>
                  {item.purpose}
                </p>

                <Field label="Responsibilities">
                  <ul className="space-y-1">
                    {item.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span style={{ color: "var(--gp-accent)" }}>›</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  <Field label="Inputs">{item.inputs}</Field>
                  <Field label="Outputs">{item.outputs}</Field>
                </div>

                <Field label="Example API payload">
                  <pre
                    className="text-xs leading-relaxed rounded-lg p-3 mt-1 overflow-x-auto"
                    style={{
                      backgroundColor: "var(--gp-bg-inset)",
                      border: "1px solid var(--gp-border)",
                      color: "var(--gp-text-2)",
                      fontFamily: "var(--gp-mono)",
                    }}
                  >
                    {item.payload}
                  </pre>
                </Field>

                <Field label="Example decision">
                  <span style={{ color: "var(--gp-text)" }}>{item.decision}</span>
                </Field>
                <Field label="Related research">{item.research}</Field>
                <Field label="Future standards">{item.standards}</Field>
              </div>
            ) : (
              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: "var(--gp-panel)", border: "1px solid var(--gp-border)" }}
              >
                <h2 className="text-base font-semibold mb-2" style={{ color: "var(--gp-text)" }}>
                  Select a component
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "var(--gp-muted)" }}>
                  Click any node in the diagram to inspect it. Each component reveals its purpose,
                  its inputs and outputs, an example API payload, the decision it makes in a real
                  transaction, and where standardization is still open.
                </p>
                <p className="text-sm leading-relaxed mt-3" style={{ color: "var(--gp-muted)" }}>
                  Hover a component to trace the data flowing into and out of it.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Footer links */}
      <div className="mt-10 flex flex-col sm:flex-row gap-3">
        <Link
          to="/architecture"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold no-underline"
          style={{ color: "var(--gp-text)", border: "1px solid var(--gp-border-strong)" }}
        >
          <FiArrowLeft size={16} /> Read the full architecture
        </Link>
        <Link
          to="/guide"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold no-underline"
          style={{ backgroundColor: "var(--gp-text)", color: "#fff" }}
        >
          Run it in the Reference Implementation <FiArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function ZoneBox({ zone, children }) {
  const m = ZONE_META[zone];
  const isCP = zone === "control-plane";
  return (
    <div
      className="rounded-xl p-4"
      style={{
        border: `${isCP ? "2px" : "1px"} solid ${isCP ? "var(--gp-accent)" : "var(--gp-border)"}`,
        backgroundColor: isCP ? "var(--gp-accent-soft)" : "transparent",
      }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <span className="gp-eyebrow" style={{ color: m.color }}>
          {m.label}
        </span>
        <span className="text-[11px]" style={{ color: "var(--gp-faint)" }}>
          {m.note}
        </span>
      </div>
      {children}
    </div>
  );
}
