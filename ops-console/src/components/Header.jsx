import { useEffect, useState } from "react";
import { api } from "../api.js";
import { FiDatabase } from "react-icons/fi";

export default function Header({ onError }) {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let alive = true;
    const base = import.meta.env.VITE_API_URL || "";
    fetch(`${base}/api/health`)
      .then((r) => r.json())
      .then((j) => alive && setHealth(j))
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const seed = async () => {
    try {
      await api.seed();
      window.dispatchEvent(new CustomEvent("ops:refresh"));
    } catch (e) {
      onError?.(String(e));
    }
  };

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-6 h-14 border-b backdrop-blur-sm"
      style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#042b27" }}
        >
          GP
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-wide" style={{ color: "var(--text)" }}>
            Governed Payments
          </h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Operator Console</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Health indicator */}
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
          {health ? (
            <>
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: "var(--success)" }}
              />
              <span>API v{health.version}</span>
            </>
          ) : (
            <span>connecting...</span>
          )}
        </div>

        {/* Seed button */}
        <button
          onClick={seed}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:opacity-90"
          style={{
            backgroundColor: "var(--panel-2)",
            color: "var(--text)",
            border: "1px solid var(--border)",
          }}
        >
          <FiDatabase size={13} />
          Seed demos
        </button>
      </div>
    </header>
  );
}
