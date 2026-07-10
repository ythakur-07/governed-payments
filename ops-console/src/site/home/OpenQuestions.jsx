import { useState } from "react";
import { FiPlus, FiMinus, FiGithub } from "react-icons/fi";

const QUESTIONS = [
  {
    q: "Should delegated authority be standardized?",
    a: "If agents are to transact across the ecosystem, the way they carry and prove authority may need to become a shared primitive rather than a per-platform convention.",
  },
  {
    q: "Should payment intent become a network primitive?",
    a: "Carrying the user’s goal alongside the transaction would let every party verify that what is paid for matches what was authorized — but it requires agreement on how intent is expressed and attested.",
  },
  {
    q: "Where should AI identity live?",
    a: "An agent’s identity could be anchored at the issuer, the wallet, a delegation authority, or an independent registry. Each choice carries different trust and liability implications.",
  },
  {
    q: "How should liability be assigned?",
    a: "When an autonomous agent spends money, responsibility may fall on the user, the agent operator, the merchant, or the issuer. Governed provenance makes this assignable — but the model is unsettled.",
  },
  {
    q: "Can payment policies become portable?",
    a: "Portable policy would let a user’s spending rules travel with them across agents and platforms, instead of being re-implemented everywhere.",
  },
  {
    q: "Can payment governance become interoperable?",
    a: "For agentic commerce to scale, governance decisions may need to be recognized across issuers, networks, and wallets rather than siloed within a single provider.",
  },
];

function Row({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--gp-border)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-base font-medium" style={{ color: "var(--gp-text)" }}>
          {q}
        </span>
        <span
          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full"
          style={{ border: "1px solid var(--gp-border)", color: "var(--gp-muted)" }}
        >
          {open ? <FiMinus size={14} /> : <FiPlus size={14} />}
        </span>
      </button>
      {open && (
        <div className="pb-5 -mt-1">
          <p className="gp-prose text-sm">{a}</p>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium mt-3 no-underline"
            style={{ color: "var(--gp-accent)" }}
          >
            <FiGithub size={14} /> Discuss on GitHub
          </a>
        </div>
      )}
    </div>
  );
}

export default function OpenQuestions() {
  return (
    <section id="open-questions" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-8">
          <div className="gp-eyebrow mb-3">Open Questions</div>
          <h2 className="gp-display text-3xl sm:text-4xl mb-4" style={{ color: "var(--gp-text)" }}>
            Questions for the industry
          </h2>
          <p className="gp-prose text-base">
            Governed Payments is an open inquiry. These are the questions the framework raises —
            and invites the ecosystem to answer.
          </p>
        </div>

        <div style={{ borderTop: "1px solid var(--gp-border)" }}>
          {QUESTIONS.map((item) => (
            <Row key={item.q} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
