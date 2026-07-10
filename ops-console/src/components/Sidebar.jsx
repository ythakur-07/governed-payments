import { NavLink } from "react-router-dom";
import { FiHome, FiBookOpen, FiGitBranch, FiCheckCircle, FiSearch, FiSliders, FiLayers, FiList } from "react-icons/fi";

const SECTIONS = [
  {
    label: "Start Here",
    items: [
      { to: "/",       label: "Home",   icon: FiHome },
      { to: "/guide",  label: "Guide",  icon: FiBookOpen },
    ],
  },
  {
    label: "Simulate",
    items: [
      { to: "/trust",         label: "Trust Graph",    icon: FiGitBranch },
      { to: "/approve",       label: "Approval Queue", icon: FiCheckCircle },
      { to: "/explorer",      label: "Task Explorer",  icon: FiSearch },
      { to: "/control-plane", label: "Control Plane",  icon: FiSliders },
    ],
  },
  {
    label: "Learn More",
    items: [
      { to: "/implementation-notes", label: "Implementation Notes", icon: FiLayers },
      { to: "/glossary",             label: "Glossary",             icon: FiList },
    ],
  },
];

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
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
  );
}

export default function Sidebar() {
  return (
    <aside
      className="hidden md:flex w-56 flex-col gap-1 py-4 px-3 border-r shrink-0 overflow-auto"
      style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
    >
      {SECTIONS.map((section, i) => (
        <div key={section.label} className={i > 0 ? "mt-4" : ""}>
          <div
            className="text-[11px] uppercase tracking-widest font-medium mb-2 px-3"
            style={{ color: "var(--muted)" }}
          >
            {section.label}
          </div>
          {section.items.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>
      ))}
    </aside>
  );
}
