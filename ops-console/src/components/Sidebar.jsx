import { NavLink } from "react-router-dom";
import { FiGitBranch, FiCheckCircle, FiSearch, FiSliders } from "react-icons/fi";

const NAV_ITEMS = [
  { to: "/",              label: "Trust Graph",    icon: FiGitBranch },
  { to: "/approve",       label: "Approval Queue", icon: FiCheckCircle },
  { to: "/explorer",      label: "Task Explorer",  icon: FiSearch },
  { to: "/control-plane", label: "Control Plane",  icon: FiSliders },
];

export default function Sidebar() {
  return (
    <aside
      className="hidden md:flex w-56 flex-col gap-1 py-4 px-3 border-r shrink-0"
      style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
    >
      <div
        className="text-[11px] uppercase tracking-widest font-medium mb-3 px-3"
        style={{ color: "var(--muted)" }}
      >
        Navigation
      </div>

      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive ? "" : "hover:opacity-80"
            }`
          }
          style={({ isActive }) => ({
            backgroundColor: isActive ? "var(--panel-2)" : "transparent",
            color: isActive ? "var(--accent)" : "var(--text)",
            border: isActive ? "1px solid var(--border)" : "1px solid transparent",
          })}
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </aside>
  );
}
