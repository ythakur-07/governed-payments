import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";

// Dark operator-console shell. Hosts the interactive Reference Implementation
// (Trust Graph, Approval Queue, Task Explorer, Control Plane) and the docs
// pages that still use the console theme.
export default function ConsoleLayout() {
  const [error, setError] = useState(null);

  return (
    <div className="flex flex-col h-screen">
      <Header onError={setError} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-lg border"
              style={{
                borderColor: "var(--danger)",
                background: "rgba(248, 113, 113, 0.08)",
                color: "var(--danger)",
              }}
            >
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-3 font-bold opacity-60 hover:opacity-100"
              >
                x
              </button>
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
}
