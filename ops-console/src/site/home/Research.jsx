import { FiArrowRight, FiArrowUpRight } from "react-icons/fi";

const TOPICS = [
  {
    title: "Architecture Whitepaper",
    blurb: "The full specification of the Governed Payments reference architecture.",
    cta: "Read the whitepaper",
    status: "upcoming",
  },
  {
    title: "Articles",
    blurb: "Essays on delegated authority, intent, and governance for agentic commerce.",
    cta: "Browse articles",
    external: true,
  },
  {
    title: "Technical Deep Dives",
    blurb: "Component-level explorations of the Control Plane and its guarantees.",
    cta: "Explore deep dives",
    status: "upcoming",
  },
  {
    title: "Architecture Notes",
    blurb: "Design decisions, trade-offs, and the reasoning behind the framework.",
    cta: "Read the notes",
    status: "upcoming",
  },
  {
    title: "Standards",
    blurb: "Proposals for delegation, intent, and policy as network primitives.",
    cta: "View standards",
    status: "upcoming",
  },
  {
    title: "Future RFCs",
    blurb: "Open drafts inviting the ecosystem to shape governed payment protocols.",
    cta: "See RFCs",
    status: "upcoming",
  },
];

export default function Research() {
  return (
    <section id="research" className="scroll-mt-20 py-20" style={{ backgroundColor: "var(--gp-bg-subtle)" }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl mb-12">
          <div className="gp-eyebrow mb-3">Research</div>
          <h2 className="gp-display text-3xl sm:text-4xl mb-4" style={{ color: "var(--gp-text)" }}>
            Organized by subject, not by date
          </h2>
          <p className="gp-prose text-base">
            The research behind Governed Payments — structured as a reference library rather
            than a chronological feed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOPICS.map((t) => (
            <div
              key={t.title}
              className="rounded-xl p-6 flex flex-col"
              style={{ backgroundColor: "var(--gp-panel)", border: "1px solid var(--gp-border)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold" style={{ color: "var(--gp-text)" }}>
                  {t.title}
                </h3>
                {t.status === "upcoming" && (
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{ color: "var(--gp-faint)", border: "1px solid var(--gp-border)" }}
                  >
                    Soon
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: "var(--gp-muted)" }}>
                {t.blurb}
              </p>
              <span
                className="inline-flex items-center gap-1 text-sm font-medium"
                style={{ color: t.status === "upcoming" ? "var(--gp-faint)" : "var(--gp-accent)" }}
              >
                {t.cta} {t.external ? <FiArrowUpRight size={14} /> : <FiArrowRight size={14} />}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
