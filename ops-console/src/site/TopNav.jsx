import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiGithub, FiArrowUpRight, FiMenu, FiX } from "react-icons/fi";

const GITHUB_URL = "https://github.com/";

// `route` items are dedicated pages; the rest are homepage section anchors
// (dedicated pages replace those in later phases).
const NAV = [
  { label: "Vision", href: "/vision", route: true },
  { label: "Architecture", href: "/architecture", route: true },
  { label: "Explorer", href: "/architecture/explore", route: true },
  { label: "Reference Implementation", href: "/#reference-implementation" },
  { label: "Research", href: "/#research" },
  { label: "About", href: "/#about" },
];

export default function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 w-full transition-colors"
      style={{
        backgroundColor: scrolled ? "rgba(255,255,255,0.85)" : "var(--gp-bg)",
        backdropFilter: scrolled ? "saturate(180%) blur(10px)" : "none",
        borderBottom: `1px solid ${scrolled ? "var(--gp-border)" : "transparent"}`,
      }}
    >
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 no-underline shrink-0">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: "var(--gp-accent)", color: "#fff" }}
          >
            GP
          </div>
          <span
            className="text-[15px] font-semibold tracking-tight"
            style={{ color: "var(--gp-text)" }}
          >
            Governed Payments
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {NAV.map((item) => {
            const cls = "text-sm no-underline transition-colors";
            const style = { color: "var(--gp-text-2)" };
            const hover = {
              onMouseEnter: (e) => (e.currentTarget.style.color = "var(--gp-text)"),
              onMouseLeave: (e) => (e.currentTarget.style.color = "var(--gp-text-2)"),
            };
            return item.route ? (
              <Link key={item.label} to={item.href} className={cls} style={style} {...hover}>
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href} className={cls} style={style} {...hover}>
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="flex items-center justify-center w-9 h-9 rounded-md no-underline transition-colors"
            style={{ color: "var(--gp-text-2)", border: "1px solid var(--gp-border)" }}
          >
            <FiGithub size={16} />
          </a>
          <Link
            to="/guide"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium no-underline transition-colors"
            style={{ backgroundColor: "var(--gp-text)", color: "#fff" }}
          >
            Launch <FiArrowUpRight size={15} />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md"
          style={{ color: "var(--gp-text)", border: "1px solid var(--gp-border)" }}
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <FiX size={18} /> : <FiMenu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="lg:hidden px-6 py-4 flex flex-col gap-1"
          style={{ backgroundColor: "var(--gp-bg)", borderTop: "1px solid var(--gp-border)" }}
        >
          {NAV.map((item) =>
            item.route ? (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setOpen(false)}
                className="py-2 text-sm no-underline"
                style={{ color: "var(--gp-text-2)" }}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-2 text-sm no-underline"
                style={{ color: "var(--gp-text-2)" }}
              >
                {item.label}
              </a>
            )
          )}
          <div className="flex items-center gap-3 mt-3">
            <Link
              to="/guide"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium no-underline"
              style={{ backgroundColor: "var(--gp-text)", color: "#fff" }}
            >
              Launch Reference Implementation <FiArrowUpRight size={15} />
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center w-9 h-9 rounded-md no-underline"
              style={{ color: "var(--gp-text-2)", border: "1px solid var(--gp-border)" }}
            >
              <FiGithub size={16} />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
