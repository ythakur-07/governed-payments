import { useEffect } from "react";
import { FiX } from "react-icons/fi";

// Lightweight, dependency-free modal used for the Core Challenges and
// Reference Architecture component detail panels.
export default function Modal({ open, onClose, children, labelledBy }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="gp-overlay fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-8 overflow-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        className="gp-fade-in relative w-full max-w-2xl my-auto rounded-xl"
        style={{
          backgroundColor: "var(--gp-panel)",
          border: "1px solid var(--gp-border)",
          boxShadow: "0 24px 64px rgba(22,25,31,0.24)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-md transition-colors"
          style={{ color: "var(--gp-muted)", border: "1px solid var(--gp-border)" }}
        >
          <FiX size={16} />
        </button>
        <div className="p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
