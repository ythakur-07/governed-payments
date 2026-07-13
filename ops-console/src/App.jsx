import { Routes, Route, Navigate } from "react-router-dom";

// Public research site (light editorial theme)
import SiteLayout from "./site/SiteLayout.jsx";
import Home from "./site/Home.jsx";
import Vision from "./site/Vision.jsx";
import Architecture from "./site/Architecture.jsx";
import ArchitectureExplorer from "./site/ArchitectureExplorer.jsx";

// Interactive Reference Implementation (dark operator-console theme)
import ConsoleLayout from "./components/ConsoleLayout.jsx";
import Guide from "./views/Guide.jsx";
import TrustGraph from "./views/TrustGraph.jsx";
import ApprovalQueue from "./views/ApprovalQueue.jsx";
import TaskExplorer from "./views/TaskExplorer.jsx";
import ControlPlaneSummary from "./views/ControlPlaneSummary.jsx";
import ImplementationNotes from "./views/Architecture.jsx";
import Glossary from "./views/Glossary.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public research site */}
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/vision" element={<Vision />} />
        <Route path="/architecture" element={<Architecture />} />
        <Route path="/architecture/explore" element={<ArchitectureExplorer />} />
      </Route>

      {/* Reference Implementation console */}
      <Route element={<ConsoleLayout />}>
        <Route path="/guide" element={<Guide />} />
        <Route path="/trust" element={<TrustGraph />} />
        <Route path="/approve" element={<ApprovalQueue />} />
        <Route path="/explorer" element={<TaskExplorer />} />
        <Route path="/control-plane" element={<ControlPlaneSummary />} />
        <Route path="/implementation-notes" element={<ImplementationNotes />} />
        <Route path="/glossary" element={<Glossary />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
