// Shared reference-architecture component model.
// Consumed by:
//   - the homepage ReferenceArchitecture section (linear flow + modal)
//   - the dedicated Architecture page (full component detail sections)
//   - the Architecture Explorer (layered trust-boundary diagram + side panel)
//
// `governance: true` marks the Control Plane components that form the
// governance layer. `zone` groups every node for the layered Explorer:
//   "untrusted"     — actors whose requests are assertions, never authority
//   "control-plane" — the governance boundary
//   "rails"         — existing payment infrastructure
//
// The Explorer requires two nodes the linear flow does not surface: the
// AI Agent (the untrusted buyer) and the Audit Engine (cross-cutting
// provenance). To keep the homepage flow and Architecture page unchanged,
// those two are excluded from the derived `FLOW` below.

export const COMPONENTS = [
  {
    key: "ai-agent",
    name: "AI Agent",
    layer: "Untrusted actor",
    zone: "untrusted",
    purpose:
      "The autonomous buyer. It reasons about a goal and proposes a transaction, but holds no spending authority of its own.",
    responsibilities: [
      "Interpret the user’s goal",
      "Discover merchants and propose a purchase",
      "Present a scoped delegation token as proof of authority",
    ],
    inputs: "User goal; merchant offers",
    outputs: "Proposed transaction plus a delegation token",
    apis: "Consumes /intent and /delegation · calls merchant APIs",
    payload: `{
  "agent": "agent://procurement-01",
  "proposes": { "amount": 350.00, "merchant": "TechSupplies Inc." },
  "delegation_token": "dlg_7e3"
}`,
    decision:
      "Proposes buying $350 of supplies from TechSupplies Inc., attaching token dlg_7e3.",
    considerations:
      "The agent is untrusted by design. Nothing it asserts is taken on trust — every claim is re-verified inside the Control Plane.",
    standards: "Verifiable agent identity; agent-to-service authentication.",
    research: "Binding a model instance to an authority token; agent attestation.",
  },
  {
    key: "merchant",
    name: "Merchant",
    layer: "Untrusted actor",
    zone: "untrusted",
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
    decision:
      "Requests $350 from agent://procurement-01 for order ord_9f2c.",
    considerations:
      "The merchant is untrusted from the Control Plane’s perspective. Its request is an assertion, not an authorization — every field is re-validated downstream.",
    standards: "Agent-readable product and offer schemas; verifiable merchant identity.",
    research: "Machine-negotiable offers; merchant attestation for agentic buyers.",
  },
  {
    key: "intent-engine",
    name: "Intent Engine",
    layer: "Control Plane",
    zone: "control-plane",
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
    decision:
      "Signed intent int_4a1 bound to the payment — goal: office supplies under $400.",
    considerations:
      "Intent must be captured before the agent acts and bound so it cannot be swapped later. The signature anchors intent to a specific user session.",
    standards: "Payment intent as a network primitive; intent attestation format.",
    research: "Intent drift detection; binding intent to authority and settlement.",
  },
  {
    key: "policy-engine",
    name: "Policy Engine",
    layer: "Control Plane",
    zone: "control-plane",
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
    decision:
      "allow, but requires_approval — $350 exceeds the $250 auto-approve threshold.",
    considerations:
      "Policy is deterministic by design — no probabilistic model sits on the critical path. Every decision is reproducible and carries the exact rules it fired.",
    standards: "Portable, interoperable policy expression.",
    research: "Cross-organization policy portability; policy composition.",
  },
  {
    key: "delegation-manager",
    name: "Delegation Manager",
    layer: "Control Plane",
    zone: "control-plane",
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
    decision:
      "Token dlg_7e3 valid: $350 ≤ $500 limit, merchant allowed, not revoked.",
    considerations:
      "Authority is scoped and time-bound, never ambient. Revocation must propagate faster than the agent can act, so it is evaluated on every request rather than cached.",
    standards: "Delegation tokens as a network primitive; cross-issuer revocation.",
    research: "Cryptographic delegation chains; portable authority.",
  },
  {
    key: "risk-engine",
    name: "Risk Engine",
    layer: "Control Plane",
    zone: "control-plane",
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
    decision:
      "Score 0.18 (low); action = escalate to operator, given the approval flag.",
    considerations:
      "Risk is advisory-plus: it can pause or escalate but never silently approves what policy denied. Escalation is an explicit boundary, not a fallback.",
    standards: "Standard escalation and human-in-the-loop protocols.",
    research: "Risk models for autonomous agents; shared ecosystem signals.",
  },
  {
    key: "payment-orchestrator",
    name: "Payment Orchestrator",
    layer: "Control Plane",
    zone: "control-plane",
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
    decision:
      "All attestations present plus human approval → idempotent release pay_5c8.",
    considerations:
      "The orchestrator is the only component that instructs the rails, and only after every attestation is present. Release is idempotent to survive retries without double-paying.",
    standards: "Governed settlement lifecycle; idempotent release semantics.",
    research: "Orchestration guarantees under partial failure.",
  },
  {
    key: "audit-engine",
    name: "Audit Engine",
    layer: "Control Plane",
    zone: "control-plane",
    governance: true,
    crosscutting: true,
    purpose:
      "Records every decision as an append-only, replayable provenance trail.",
    responsibilities: [
      "Capture each check’s inputs, outputs, and rationale",
      "Maintain a tamper-evident, append-only ledger",
      "Enable full replay and liability attribution",
    ],
    inputs: "Decision events from every Control Plane component",
    outputs: "Append-only provenance records; a replayable audit trail",
    apis: "POST /audit/record · GET /audit/{payment_id}",
    payload: `{
  "payment_id": "pay_5c8",
  "events": ["intent", "delegation", "policy", "risk", "approval", "release"],
  "chain": "intact",
  "append_only": true
}`,
    decision:
      "Recorded six events — intent, delegation, policy, risk, approval, release — chain intact.",
    considerations:
      "Audit is a first-class component, not a logging side-effect. Every decision is recorded before money moves, so the transaction can be reconstructed exactly and liability attributed at each step.",
    standards: "Portable provenance format; verifiable, tamper-evident audit trails.",
    research: "Cross-organization provenance; cryptographic tamper-evidence.",
  },
  {
    key: "wallet",
    name: "Wallet",
    layer: "Rails",
    zone: "rails",
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
    decision: "Debited the funding source; returned network_ref auth_31b9.",
    considerations:
      "The wallet trusts the orchestrator’s release instruction. In a mature ecosystem it would verify the attestations itself rather than trusting the caller.",
    standards: "Interoperability with governed release instructions.",
    research: "Native wallet support for delegated, intent-bound payments.",
  },
  {
    key: "network",
    name: "Network",
    layer: "Rails",
    zone: "rails",
    purpose: "Routes the transaction between the wallet and the issuer.",
    responsibilities: ["Route authorization and clearing messages"],
    inputs: "Payment message from the wallet",
    outputs: "Authorization response",
    apis: "Existing card / account network rails",
    payload: `{
  "network_ref": "auth_31b9",
  "status": "approved"
}`,
    decision: "Routed the authorization; issuer approved.",
    considerations:
      "Today’s networks carry amount and payee but not intent or authority. Governance metadata rides alongside until networks can consume it natively.",
    standards: "Carrying intent and authority metadata across the network.",
    research: "Governance-aware network primitives.",
  },
  {
    key: "issuer",
    name: "Issuer",
    layer: "Rails",
    zone: "rails",
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
    decision: "Approved auth_31b9 against the account; funds settled.",
    considerations:
      "The issuer is the final backstop. Governance attestations give it richer grounds for decisioning and clearer liability attribution.",
    standards: "Consuming attested intent and delegation in decisioning.",
    research: "Issuer-side use of governance attestations for liability.",
  },
];

// Fast lookup by key.
export const BY_KEY = Object.fromEntries(COMPONENTS.map((c) => [c.key, c]));

// The linear request path used by the homepage flow and the Architecture
// page. Excludes the AI Agent (untrusted origin) and Audit Engine
// (cross-cutting) so those pages render exactly as before.
const FLOW_ORDER = [
  "merchant",
  "intent-engine",
  "policy-engine",
  "delegation-manager",
  "risk-engine",
  "payment-orchestrator",
  "wallet",
  "network",
  "issuer",
];
export const FLOW = FLOW_ORDER.map((k) => BY_KEY[k]);

export const GOVERNANCE_KEYS = COMPONENTS.filter((c) => c.governance).map((c) => c.key);
