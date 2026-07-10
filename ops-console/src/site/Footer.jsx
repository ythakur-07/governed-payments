import { Link } from "react-router-dom";

const COLUMNS = [
  {
    title: "Framework",
    links: [
      { label: "Vision", href: "/vision", route: true },
      { label: "Architecture", href: "/architecture", route: true },
      { label: "Reference Implementation", href: "/#reference-implementation" },
    ],
  },
  {
    title: "Research",
    links: [
      { label: "Research Library", href: "/#research" },
      { label: "Open Questions", href: "/#open-questions" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "About the Initiative", href: "/#about" },
      { label: "GitHub", href: "https://github.com/", external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--gp-border)", backgroundColor: "var(--gp-bg-subtle)" }}>
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand blurb */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: "var(--gp-accent)", color: "#fff" }}
              >
                GP
              </div>
              <span className="text-sm font-semibold" style={{ color: "var(--gp-text)" }}>
                Governed Payments
              </span>
            </div>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--gp-muted)" }}>
              A reference architecture for Agentic Commerce.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="gp-eyebrow mb-3" style={{ color: "var(--gp-faint)" }}>
                {col.title}
              </div>
              <ul className="space-y-2.5">
                {col.links.map((l) =>
                  l.external ? (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm no-underline"
                        style={{ color: "var(--gp-text-2)" }}
                      >
                        {l.label}
                      </a>
                    </li>
                  ) : l.route ? (
                    <li key={l.label}>
                      <Link to={l.href} className="text-sm no-underline" style={{ color: "var(--gp-text-2)" }}>
                        {l.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={l.label}>
                      <a href={l.href} className="text-sm no-underline" style={{ color: "var(--gp-text-2)" }}>
                        {l.label}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{ borderTop: "1px solid var(--gp-border)" }}
        >
          <p className="text-xs" style={{ color: "var(--gp-faint)" }}>
            Governed Payments — an independent research initiative exploring governance models for Agentic Commerce.
          </p>
          <Link to="/guide" className="text-xs no-underline" style={{ color: "var(--gp-muted)" }}>
            Launch the Reference Implementation →
          </Link>
        </div>
      </div>
    </footer>
  );
}
