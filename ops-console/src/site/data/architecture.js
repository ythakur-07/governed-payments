// Shared reference-architecture component model.
// Consumed by the homepage ReferenceArchitecture section (interactive flow +
// modal) and the dedicated Architecture page (full component detail sections).
//
// `governance: true` marks the five Control Plane components that form the
// governance layer. The remaining nodes are the origin (Merchant) and the
// existing payment rails (Wallet, Network, Issuer).

export const COMPONENTS = [
  {
    key: "merchant",
    name: "Merchant",
    layer: "Origin",
    purpose:
      "The counterparty an agent is transacting with — where a purchase originates.",
    responsibilities: [
      "Presents goods, services, and prices to the agent",
      "Requests payment for an agreed order",
    ],
    inputs: "Agent request to purchase; order details",
    outputs: "Payment request with amount, currency, and payee",
    apis: "POST /orders · POST /payment-requests",
    payload: `{
  "order_id": "ord_9f2c",
  "amount": 350.00,
  "currency": "USD",
  "payee": "TechSupplies Inc.",
  "items": [{ "sku": "kbd-01", "qty": 5 }]
}`,
    considerations:
      "The merchant is untrusted from the Control Plane’s perspective. Its request is an assertion, not an authorization — every field is re-validated downstream.",
    standards: "Agent-readable product and offer schemas; verifiable merchant identity.",
    research: "Machine-negotiable offers; merchant attestation for agentic buyers.",
  },
  {
    key: "intent-engine",
    name: "Intent Engine",
    layer: "Control Plane",
    governance: true,
    purpose:
      "Captures the user’s goal as structured, signed intent and binds it to the transaction.",
    responsibilities: [
      "Translate a natural-language goal into structured intent",
      "Sign and attest intent",
      "Bind intent to the resulting payment",
    ],
    inputs: "User goal; agent-proposed transaction",
    outputs: "Signed intent object bound to the request",
    apis: "POST /intent · GET /intent/{id}/verify",
    payload: `{
  "intent_id": "int_4a1",
  "goal": "Buy office supplies, under $400",
  "constraints": { "max_amount": 400, "category": "supplies" },
  "sig": "ed25519:…"
}`,
    considerations:
      "Intent must be captured before the agent acts and bound so it cannot be swapped later. The signature anchors intent to a specific user session.",
    standards: "Payment intent as a network primitive; intent attestation format.",
    research: "Intent drift detection; binding intent to authority and settlement.",
  },
  {
    key: "policy-engine",
    name: "Policy Engine",
    layer: "Control Plane",
    governance: true,
    purpose:
      "Makes deterministic, binary decisions against explicit rules and records the reason.",
    responsibilities: [
      "Evaluate spend limits, merchant allowlists, currency and thresholds",
      "Return an auditable allow/deny with reason",
    ],
    inputs: "Transaction request; authority token; policy set",
    outputs: "Deterministic decision with recorded rationale",
    apis: "POST /policy/evaluate",
    payload: `{
  "decision": "allow",
  "requires_approval": true,
  "reason": "amount 350 > auto-approve 250; within limit 500",
  "rules_fired": ["spend_limit", "approval_threshold"]
}`,
    considerations:
      "Policy is deterministic by design — no probabilistic model sits on the critical path. Every decision is reproducible and carries the exact rules it fired.",
    standards: "Portable, interoperable policy expression.",
    research: "Cross-organization policy portability; policy composition.",
  },
  {
    key: "delegation-manager",
    name: "Delegation Manager",
    layer: "Control Plane",
    governance: true,
    purpose:
      "Issues and verifies scoped authority tokens and propagates revocation.",
    responsibilities: [
      "Mint scoped delegation tokens (limit, merchants, depth, expiry)",
      "Verify the delegation chain",
      "Revoke authority system-wide",
    ],
    inputs: "Grant request; delegation chain to verify",
    outputs: "Verifiable authority token; revocation events",
    apis: "POST /delegation · POST /delegation/{id}/revoke",
    payload: `{
  "token_id": "dlg_7e3",
  "agent": "agent://procurement-01",
  "spend_limit": 500.00,
  "merchants": ["TechSupplies Inc."],
  "max_depth": 1,
  "expires_at": "2026-07-09T00:00:00Z",
  "status": "active"
}`,
    considerations:
      "Authority is scoped and time-bound, never ambient. Revocation must propagate faster than the agent can act, so it is evaluated on every request rather than cached.",
    standards: "Delegation tokens as a network primitive; cross-issuer revocation.",
    research: "Cryptographic delegation chains; portable authority.",
  },
  {
    key: "risk-engine",
    name: "Risk Engine",
    layer: "Control Plane",
    governance: true,
    purpose:
      "Scores each transaction in context and escalates high-stakes requests to humans.",
    responsibilities: [
      "Assess velocity, counterparty, and anomaly signals",
      "Route to human-in-the-loop review when warranted",
    ],
    inputs: "Transaction context; historical signals",
    outputs: "Risk score; proceed / pause / escalate decision",
    apis: "POST /risk/score",
    payload: `{
  "score": 0.18,
  "band": "low",
  "action": "escalate",
  "signals": ["amount_above_threshold"],
  "escalate_to": "operator"
}`,
    considerations:
      "Risk is advisory-plus: it can pause or escalate but never silently approves what policy denied. Escalation is an explicit boundary, not a fallback.",
    standards: "Standard escalation and human-in-the-loop protocols.",
    research: "Risk models for autonomous agents; shared ecosystem signals.",
  },
  {
    key: "payment-orchestrator",
    name: "Payment Orchestrator",
    layer: "Control Plane",
    governance: true,
    purpose:
      "Sequences the governed lifecycle and releases the payment to the rails only when cleared.",
    responsibilities: [
      "Coordinate intent, policy, delegation, and risk checks",
      "Drive the state machine to settlement and reconciliation",
    ],
    inputs: "Cleared transaction with all attestations",
    outputs: "Release instruction to the wallet; lifecycle events",
    apis: "POST /payments/release · GET /payments/{id}",
    payload: `{
  "payment_id": "pay_5c8",
  "state": "released",
  "attestations": ["intent", "policy", "delegation", "risk"],
  "idempotency_key": "pay_5c8-release"
}`,
    considerations:
      "The orchestrator is the only component that instructs the rails, and only after every attestation is present. Release is idempotent to survive retries without double-paying.",
    standards: "Governed settlement lifecycle; idempotent release semantics.",
    research: "Orchestration guarantees under partial failure.",
  },
  {
    key: "wallet",
    name: "Wallet",
    layer: "Rails",
    purpose: "Holds funds or credentials and executes the authorized payment.",
    responsibilities: ["Debit the funding source", "Return a payment result"],
    inputs: "Authorized release instruction",
    outputs: "Payment confirmation or failure",
    apis: "Existing wallet / PSP APIs",
    payload: `{
  "payment_id": "pay_5c8",
  "result": "confirmed",
  "network_ref": "auth_31b9"
}`,
    considerations:
      "The wallet trusts the orchestrator’s release instruction. In a mature ecosystem it would verify the attestations itself rather than trusting the caller.",
    standards: "Interoperability with governed release instructions.",
    research: "Native wallet support for delegated, intent-bound payments.",
  },
  {
    key: "network",
    name: "Network",
    layer: "Rails",
    purpose: "Routes the transaction between the wallet and the issuer.",
    responsibilities: ["Route authorization and clearing messages"],
    inputs: "Payment message from the wallet",
    outputs: "Authorization response",
    apis: "Existing card / account network rails",
    payload: `{
  "network_ref": "auth_31b9",
  "status": "approved"
}`,
    considerations:
      "Today’s networks carry amount and payee but not intent or authority. Governance metadata rides alongside until networks can consume it natively.",
    standards: "Carrying intent and authority metadata across the network.",
    research: "Governance-aware network primitives.",
  },
  {
    key: "issuer",
    name: "Issuer",
    layer: "Rails",
    purpose: "Approves or declines the transaction against the funding account.",
    responsibilities: ["Authorize against account state", "Settle funds"],
    inputs: "Authorization request",
    outputs: "Approve / decline; settlement",
    apis: "Existing issuer authorization APIs",
    payload: `{
  "auth_id": "auth_31b9",
  "decision": "approved",
  "settled": true
}`,
    considerations:
      "The issuer is the final backstop. Governance attestations give it richer grounds for decisioning and clearer liability attribution.",
    standards: "Consuming attested intent and delegation in decisioning.",
    research: "Issuer-side use of governance attestations for liability.",
  },
];

export const GOVERNANCE_KEYS = COMPONENTS.filter((c) => c.governance).map((c) => c.key);
