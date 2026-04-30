// Thin client for the FastAPI backend.
// In dev: Vite proxies /api to localhost:8000 (VITE_API_URL is unset → empty string).
// In production: VITE_API_URL points to the Render backend URL.

const BASE = import.meta.env.VITE_API_URL || "";

const json = async (res) => {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json();
};

export const api = {
  controlPlane: () => fetch(`${BASE}/api/control-plane`).then(json),
  setKillSwitch: (active) =>
    fetch(`${BASE}/api/control-plane/kill-switch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    }).then(json),

  tokens:     () => fetch(`${BASE}/api/tokens`).then(json),
  trustGraph: () => fetch(`${BASE}/api/trust-graph`).then(json),

  tasks:             () => fetch(`${BASE}/api/tasks`).then(json),
  awaitingApproval:  () => fetch(`${BASE}/api/tasks/awaiting-approval`).then(json),
  task:              (id) => fetch(`${BASE}/api/tasks/${id}`).then(json),
  approve:           (id, operator) =>
    fetch(`${BASE}/api/tasks/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operator }),
    }).then(json),

  seed: () => fetch(`${BASE}/api/seed`, { method: "POST" }).then(json),
};
