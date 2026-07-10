const TODAY = ["Human", "Wallet", "Network", "Issuer"];
const AGENTIC = ["Merchant", "AI Agent", "???", "Wallet", "Network", "Issuer"];

function FlowColumn({ title, subtitle, nodes }) {
  return (
    <div
      className="rounded-xl p-6 sm:p-8 h-full"
      style={{ backgroundColor: "var(--gp-panel)", border: "1px solid var(--gp-border)" }}
    >
      <div className="gp-eyebrow" style={{ color: "var(--gp-faint)" }}>
        {subtitle}
      </div>
      <h3 className="text-lg font-semibold mt-1 mb-6" style={{ color: "var(--gp-text)" }}>
        {title}
      </h3>

      <div className="flex flex-col items-center gap-0">
        {nodes.map((node, i) => {
          const isGap = node === "???";
          return (
            <div key={i} className="flex flex-col items-center w-full">
              <div
                className="w-full max-w-[220px] text-center rounded-lg py-3 px-4 text-sm font-medium"
                style={
                  isGap
                    ? {
                        backgroundColor: "var(--gp-accent-soft)",
                        border: "1px dashed var(--gp-accent)",
                        color: "var(--gp-accent-strong)",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                      }
                    : {
                        backgroundColor: "var(--gp-bg-subtle)",
                        border: "1px solid var(--gp-border)",
                        color: "var(--gp-text)",
                      }
                }
              >
                {isGap ? "??? — no governance layer" : node}
              </div>
              {i < nodes.length - 1 && (
                <div className="gp-flow-arrow py-1.5 text-lg leading-none">↓</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Problem() {
  return (
    <section id="problem" className="scroll-mt-20 py-20" style={{ backgroundColor: "var(--gp-bg-subtle)" }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl mb-12">
          <div className="gp-eyebrow mb-3">The Problem</div>
          <h2 className="gp-display text-3xl sm:text-4xl mb-4" style={{ color: "var(--gp-text)" }}>
            AI fundamentally changes payments
          </h2>
          <p className="gp-prose text-base">
            Today’s payment infrastructure was designed for a human at the point of
            decision. Agentic commerce inserts an autonomous actor into that flow — one
            that existing systems have no way to evaluate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FlowColumn subtitle="Today’s Commerce" title="Built for humans" nodes={TODAY} />
          <FlowColumn subtitle="Agentic Commerce" title="A new, unevaluated actor" nodes={AGENTIC} />
        </div>

        {/* The missing layer */}
        <div className="mt-12 max-w-2xl">
          <h3 className="gp-display text-2xl sm:text-3xl mb-3" style={{ color: "var(--gp-text)" }}>
            The missing layer is governance
          </h3>
          <p className="gp-prose text-base">
            AI agents introduce decisions that existing payment systems were never designed
            to evaluate: who authorized the agent, whether it understood the user’s intent,
            whether the purchase is permitted, and whether it should proceed at all.
            Governed Payments fills this architectural gap.
          </p>
        </div>
      </div>
    </section>
  );
}
