import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import TrustGraph from "./views/TrustGraph.jsx";
import ApprovalQueue from "./views/ApprovalQueue.jsx";
import TaskExplorer from "./views/TaskExplorer.jsx";
import ControlPlaneSummary from "./views/ControlPlaneSummary.jsx";
import Guide from "./views/Guide.jsx";
import Architecture from "./views/Architecture.jsx";

export default function App() {
  const [error, setError] = useState(null);

  return (
    <div className="flex flex-col h-screen">
      <Header onError={setError} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg border"
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

          <Routes>
            <Route path="/" element={<TrustGraph />} />
            <Route path="/approve" element={<ApprovalQueue />} />
            <Route path="/explorer" element={<TaskExplorer />} />
            <Route path="/control-plane" element={<ControlPlaneSummary />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
