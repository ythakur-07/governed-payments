import { FiArrowUpRight } from "react-icons/fi";

const LINKS = [
  { label: "Portfolio", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "Medium", href: "#" },
  { label: "GitHub", href: "https://github.com/" },
];

export default function About() {
  return (
    <section id="about" className="scroll-mt-20 py-20" style={{ backgroundColor: "var(--gp-bg-subtle)" }}>
      <div className="mx-auto max-w-3xl px-6">
        <div className="gp-eyebrow mb-3">About</div>
        <h2 className="gp-display text-3xl sm:text-4xl mb-4" style={{ color: "var(--gp-text)" }}>
          An independent research initiative
        </h2>
        <p className="gp-prose text-base">
          Governed Payments is an independent research initiative exploring governance models
          for Agentic Commerce. It proposes a reference architecture and a working reference
          implementation as a starting point for industry discussion.
        </p>

        <div className="mt-8 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm" style={{ color: "var(--gp-muted)" }}>
            Created by
          </span>
          <span className="text-sm font-semibold" style={{ color: "var(--gp-text)" }}>
            Yash Thakur
          </span>
          <span className="text-sm" style={{ color: "var(--gp-muted)" }}>
            · Group Product Manager at PayPal · Independent research
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noreferrer" : undefined}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium no-underline"
              style={{ color: "var(--gp-text-2)", border: "1px solid var(--gp-border)" }}
            >
              {l.label} <FiArrowUpRight size={14} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
