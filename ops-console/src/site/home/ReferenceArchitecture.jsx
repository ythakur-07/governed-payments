import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import Modal from "../Modal.jsx";
import { COMPONENTS } from "../data/architecture.js";

function Node({ c, index, flowActive, onOpen }) {
  const gov = c.governance;
  return (
    <button
      onClick={() => onOpen(c.key)}
      className="relative w-full max-w-[280px] text-left rounded-lg px-4 py-3 transition-all"
      style={{
        backgroundColor: gov ? "var(--gp-panel)" : "var(--gp-bg-subtle)",
        border: `1px solid ${
          flowActive ? "var(--gp-accent)" : gov ? "var(--gp-border-strong)" : "var(--gp-border)"
        }`,
        boxShadow: flowActive ? "0 6px 18px rgba(15,118,110,0.16)" : "none",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--gp-text)" }}>
            {c.name}
          </div>
          <div className="text-xs mt-0.5" style={{ color: gov ? "var(--gp-accent)" : "var(--gp-faint)" }}>
            {c.layer}
          </div>
        </div>
        <span
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{
            backgroundColor: flowActive ? "var(--gp-accent)" : "var(--gp-bg-inset)",
            color: flowActive ? "#fff" : "var(--gp-faint)",
          }}
        >
          {index + 1}
        </span>
      </div>
    </button>
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

export default function ReferenceArchitecture() {
  const [active, setActive] = useState(null);
  const [hovering, setHovering] = useState(false);
  const item = COMPONENTS.find((c) => c.key === active) || null;

  return (
    <section
      id="architecture"
      className="scroll-mt-20 py-20"
      style={{ backgroundColor: "var(--gp-bg-subtle)" }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl mb-12">
          <div className="gp-eyebrow mb-3">Reference Architecture</div>
          <h2 className="gp-display text-3xl sm:text-4xl mb-4" style={{ color: "var(--gp-text)" }}>
            A governance layer between the agent and the rails
          </h2>
          <p className="gp-prose text-base">
            Every request flows through the Control Plane before it reaches existing payment
            rails. Select any component to see its purpose, inputs, outputs, and example APIs —
            or hover to trace the complete request flow.
          </p>
        </div>

        <div
          className="rounded-2xl p-6 sm:p-10"
          style={{ backgroundColor: "var(--gp-panel)", border: "1px solid var(--gp-border)" }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <div className="flex flex-col items-center">
            {COMPONENTS.map((c, i) => (
              <div key={c.key} className="flex flex-col items-center w-full">
                <Node c={c} index={i} flowActive={hovering} onOpen={setActive} />
                {i < COMPONENTS.length - 1 && (
                  <div
                    className="py-1.5 text-lg leading-none transition-colors"
                    style={{ color: hovering ? "var(--gp-accent)" : "var(--gp-faint)" }}
                  >
                    ↓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs mt-4 text-center" style={{ color: "var(--gp-faint)" }}>
          The five Control Plane components form the governance layer. Wallet, Network, and
          Issuer are existing payment rails.
        </p>

        <div className="mt-8 text-center">
          <Link
            to="/architecture"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold no-underline"
            style={{ color: "var(--gp-text)", border: "1px solid var(--gp-border-strong)" }}
          >
            View the full architecture <FiArrowRight size={16} />
          </Link>
        </div>
      </div>

      <Modal open={!!item} onClose={() => setActive(null)} labelledBy="component-title">
        {item && (
          <div>
            <div className="gp-eyebrow mb-2">{item.layer}</div>
            <h3 id="component-title" className="gp-display text-2xl mb-2" style={{ color: "var(--gp-text)" }}>
              {item.name}
            </h3>
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

            <Field label="Example APIs" mono>
              {item.apis}
            </Field>
            <Field label="Future standards">{item.standards}</Field>
            <Field label="Related research">{item.research}</Field>
          </div>
        )}
      </Modal>
    </section>
  );
}
