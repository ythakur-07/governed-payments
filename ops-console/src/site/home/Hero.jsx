import { Link } from "react-router-dom";
import { FiArrowRight, FiArrowUpRight } from "react-icons/fi";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Minimal background: a single soft radial wash, no screenshots */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, var(--gp-accent-soft) 0%, rgba(255,255,255,0) 70%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-6 pt-24 pb-20 text-center">
        <div className="gp-eyebrow mb-6">Independent Research Initiative</div>

        <h1
          className="gp-display text-5xl sm:text-6xl md:text-7xl"
          style={{ color: "var(--gp-text)" }}
        >
          Governed Payments
        </h1>

        <p
          className="mt-5 text-lg sm:text-xl font-medium"
          style={{ color: "var(--gp-text-2)" }}
        >
          The Reference Architecture for Agentic Commerce
        </p>

        <div className="mt-7 mx-auto gp-prose text-center" style={{ maxWidth: "36rem" }}>
          <p className="text-base sm:text-lg" style={{ color: "var(--gp-text-2)" }}>
            AI agents can browse, reason, and make decisions. They still cannot safely
            spend money. Governed Payments introduces a governance layer that enables
            secure, auditable, and policy-aware autonomous commerce.
          </p>
        </div>

        {/* CTAs — the reference implementation is intentionally the tertiary action */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/vision"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold no-underline transition-colors"
            style={{ backgroundColor: "var(--gp-text)", color: "#fff" }}
          >
            Read the Vision <FiArrowRight size={16} />
          </Link>
          <Link
            to="/architecture"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold no-underline transition-colors"
            style={{ color: "var(--gp-text)", border: "1px solid var(--gp-border-strong)" }}
          >
            Explore the Architecture
          </Link>
          <Link
            to="/guide"
            className="inline-flex items-center gap-1.5 px-2 py-3 text-sm font-medium no-underline"
            style={{ color: "var(--gp-muted)" }}
          >
            Launch Reference Implementation <FiArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
