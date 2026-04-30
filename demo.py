#!/usr/bin/env python3
"""
demo.py — Wires all service boundaries together and runs three scenarios.

Service graph (mirrors nkhatu/control-architecture):

  OrchestratorAPI
    ├── ControlPlane          (config + registry publisher)
    ├── PolicyEngine          (deterministic decisions)
    ├── ContextMemoryService  (current task snapshot + outbox)
    ├── ProvenanceService     (append-only evidence + delegations)
    └── WorkflowWorker
          ├── PolicyEngine    (re-validates at every transition)
          ├── CapabilityGateway
          │     ├── create_instruction      (no side-effect)
          │     ├── validate_beneficiary    (delegated: compliance_screening)
          │     └── release_payment        (side-effect, idempotent, approval-gated)
          ├── ContextMemoryService
          └── ProvenanceService

Scenarios:
  A — Happy path:         $350 → validation → approval gate → operator resume → settled
  B — Authority violation: $600 exceeds remaining limit → denied at intake
  C — Revocation:          token revoked → denied at intake policy
"""
from datetime import datetime, timedelta
from control_plane import ControlPlane
from policy_engine import PolicyEngine
from capability_gateway import CapabilityGateway
from context_memory import ContextMemoryService
from provenance import ProvenanceService
from workflow_worker import WorkflowWorker
from orchestrator import OrchestratorAPI
from models import DelegationToken


# ══════════════════════════════════════════════════════════════════════════════
#  DISPLAY HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def banner(title, refs):
    print(f"\n\n{'═'*80}")
    print(f"  {title}")
    for r in refs:
        print(f"  ↳ {r}")
    print(f"{'═'*80}")


def section(title):
    print(f"\n  {'─'*76}")
    print(f"  {title}")
    print(f"  {'─'*76}")


def print_task_view(api, task_id):
    view = api.get_task(task_id)
    snap = view.get("snapshot", {})
    dels = view.get("delegations", [])
    print(f"\n  ┌─ TASK VIEW ────────────────────────────────────────────────────")
    print(f"  │  task_id      : {snap.get('task_id')}")
    print(f"  │  state        : {snap.get('state')}")
    print(f"  │  amount       : ${snap.get('amount'):.2f} {snap.get('currency')}")
    print(f"  │  merchant     : {snap.get('merchant')}")
    print(f"  │  liability    : {snap.get('liability_owner')}")
    print(f"  │  approved_by  : {snap.get('approval_by') or '—'}")
    print(f"  │  release_ref  : {snap.get('release_ref') or '—'}")
    print(f"  │  provenance   : {view.get('provenance_count')} records")
    if dels:
        print(f"  │  delegations  :")
        for d in dels:
            print(f"  │    [{d['status']:^9}]  {d['delegated_to']}  →  {d['action']}")
    print(f"  └───────────────────────────────────────────────────────────────")


def print_provenance(provenance_svc, task_id):
    records = provenance_svc.get_task_evidence(task_id)
    print(f"\n  ┌─ PROVENANCE LOG ({len(records)} records) ──────────────────────────────────")
    for r in records:
        icon = {"state_transition": "→", "artifact": "◆", "delegation": "⇢"}.get(r.record_type, "·")
        d = r.data
        if r.record_type == "state_transition":
            frm = d.get('from_state') or '—'
            to  = d.get('to_state')   or '—'
            print(f"  │  {icon} [{r.record_type:16}]  {frm:25} → {to:25}  | liability: {d.get('liability','—')}")
        elif r.record_type == "artifact":
            atype = d.get("artifact_type","")
            if atype == "policy_decision":
                print(f"  │  {icon} [{r.record_type:16}]  policy:{d.get('decision'):6} | {d.get('reason','')[:55]}")
            elif atype == "capability_result":
                print(f"  │  {icon} [{r.record_type:16}]  {d.get('capability'):22} | outcome: {d.get('outcome')}")
        elif r.record_type == "delegation":
            print(f"  │  {icon} [{r.record_type:16}]  {d.get('delegated_to'):35} | {d.get('action'):25} | {d.get('status')}")
    print(f"  └───────────────────────────────────────────────────────────────")


# ══════════════════════════════════════════════════════════════════════════════
#  SERVICE WIRING
# ══════════════════════════════════════════════════════════════════════════════

def build_services():
    """
    Wire all service boundaries together.
    In production: each of these is a separate deployed service.
    Here they share a process for PoC purposes.
    """
    cp      = ControlPlane()
    pe      = PolicyEngine(cp)
    gw      = CapabilityGateway()
    ctx     = ContextMemoryService()
    prov    = ProvenanceService()
    worker  = WorkflowWorker(ctx, prov, gw, pe)

    # Delegation tokens — Article 3: scoped authority, not just identity
    tokens = {
        "tok_agent_001": DelegationToken(
            token_id="tok_agent_001",
            principal="procurement-agent-v1",
            delegated_by="root-authorization-service",
            delegation_depth_remaining=2,
            spend_limit=500.00,
            spent=0.0,
            merchant_allowlist=["merchant_techsupplies", "merchant_cloudsvc"],
            currency_restriction="USD",
            valid_until=datetime.now() + timedelta(hours=24),
            reversal_window_hours=24,
        ),
        "tok_agent_002": DelegationToken(
            token_id="tok_agent_002",
            principal="procurement-agent-v1",
            delegated_by="root-authorization-service",
            delegation_depth_remaining=2,
            spend_limit=500.00,
            spent=0.0,
            merchant_allowlist=["merchant_techsupplies"],
            currency_restriction="USD",
            valid_until=datetime.now() + timedelta(hours=24),
            reversal_window_hours=24,
            revoked=True,   # pre-revoked for Scenario C
        ),
    }

    api = OrchestratorAPI(cp, pe, ctx, prov, worker, tokens)
    return api, prov, tokens


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN DEMO
# ══════════════════════════════════════════════════════════════════════════════

def run():
    print("\n" + "█"*80)
    print("  GOVERNED AGENTIC PAYMENT — CONTROL PLANE  (Level 1 Refactor)")
    print("  Separate service boundaries · Dual memory · Approval gate · Delegated agents")
    print("  Articles 1 · 2 · 3  —  Governance · Control Plane · Delegated Authority")
    print("█"*80)

    api, prov, tokens = build_services()

    section("SERVICE REGISTRY  (control_plane)")
    from control_plane import ControlPlane
    cp = ControlPlane()
    print(f"\n  Control Plane version: {cp.version()}")
    print(f"  Kill switch:           {'ACTIVE' if not cp.is_live() else 'off'}")
    print(f"  Rail: max ${cp.rail_controls().max_amount:.0f} | approval above ${cp.rail_controls().approval_required_above:.0f}")
    print(f"  Capabilities: {', '.join(c.name for c in cp.capabilities())}")
    print(f"  Agents:       {', '.join(a.agent_id for a in cp.agents())}")

    section("DELEGATION TOKENS  (Articles 3 — MDP)")
    for tid, tok in tokens.items():
        status = "⛔ REVOKED" if tok.revoked else "✓ active"
        print(f"  {tid}: ${tok.spend_limit:.0f} limit | {tok.currency_restriction} | "
              f"depth:{tok.delegation_depth_remaining} | {status}")

    # ─────────────────────────────────────────────────────────────────────────
    # SCENARIO A: Happy path — $350, approval gate, operator resume
    # ─────────────────────────────────────────────────────────────────────────
    banner(
        "SCENARIO A — HAPPY PATH  ($350 | approval gate | operator resume)",
        [
            "Article 1: Liability boundary tagged at every state transition",
            "Article 2: All 6 control plane components + approval gate + delegated agents",
            "Article 3: Authority re-validated at intake AND at release transition",
        ]
    )

    result_a = api.submit_payment(
        amount=350.00, currency="USD",
        sender_wallet="wallet_corp_01",
        receiver_wallet="wallet_techsupplies_01",
        merchant_id="merchant_techsupplies",
        merchant_name="TechSupplies Inc.",
        initiated_by="user_yash",
        token_id="tok_agent_001",
        idempotency_key="idem_order_8821",
    )
    task_id_a = result_a["task_id"]

    print(f"\n  [ORCHESTR ]  submit_payment → state: {result_a['state']}")
    print(f"  ⏸  Task {task_id_a} is awaiting operator approval")
    print(f"     Amount ${350:.2f} > ${api._cp.rail_controls().approval_required_above:.0f} threshold")

    # Operator approves
    print(f"\n  [OPS CONSOLE]  Operator 'ops_admin' approves task {task_id_a}")
    result_resume = api.resume_after_approval(task_id_a, operator="ops_admin")
    print(f"\n  [ORCHESTR ]  resume → state: {result_resume['state']}")

    print_task_view(api, task_id_a)
    print_provenance(prov, task_id_a)

    # ─────────────────────────────────────────────────────────────────────────
    # SCENARIO B: Authority violation — $600 exceeds remaining limit
    # ─────────────────────────────────────────────────────────────────────────
    banner(
        "SCENARIO B — AUTHORITY VIOLATION  ($600 | remaining authority $150)",
        [
            "Article 3: MDP enforced at policy_engine — amount exceeds remaining authority",
            "Article 2: Blocked before workflow starts, no capability calls made",
        ]
    )

    result_b = api.submit_payment(
        amount=600.00, currency="USD",
        sender_wallet="wallet_corp_01",
        receiver_wallet="wallet_techsupplies_01",
        merchant_id="merchant_techsupplies",
        merchant_name="TechSupplies Inc.",
        initiated_by="user_yash",
        token_id="tok_agent_001",
        idempotency_key="idem_order_9004",
    )
    task_id_b = result_b["task_id"]
    print(f"\n  [ORCHESTR ]  submit_payment → state: {result_b['state']}")
    print(f"  reason: {result_b.get('reason')}")

    print_task_view(api, task_id_b)
    print_provenance(prov, task_id_b)

    # ─────────────────────────────────────────────────────────────────────────
    # SCENARIO C: Revoked token — blocked at intake
    # ─────────────────────────────────────────────────────────────────────────
    banner(
        "SCENARIO C — REVOKED TOKEN  (first-class state transition)",
        [
            "Article 3: Revocation is not an edge case — it is a first-class block",
            "Article 1: Governance failure modes modeled explicitly, not as exceptions",
        ]
    )

    result_c = api.submit_payment(
        amount=200.00, currency="USD",
        sender_wallet="wallet_corp_01",
        receiver_wallet="wallet_techsupplies_01",
        merchant_id="merchant_techsupplies",
        merchant_name="TechSupplies Inc.",
        initiated_by="user_yash",
        token_id="tok_agent_002",   # pre-revoked token
        idempotency_key="idem_order_9201",
    )
    task_id_c = result_c["task_id"]
    print(f"\n  [ORCHESTR ]  submit_payment → state: {result_c['state']}")
    print(f"  reason: {result_c.get('reason')}")

    print_task_view(api, task_id_c)
    print_provenance(prov, task_id_c)

    # ─────────────────────────────────────────────────────────────────────────
    # FULL PROVENANCE ACROSS ALL TASKS
    # ─────────────────────────────────────────────────────────────────────────
    all_records = prov.get_all_records()
    print(f"\n\n{'█'*80}")
    print(f"  COMPLETE PROVENANCE  —  {len(all_records)} records across {3} tasks")
    print(f"  Every state transition. Every policy decision. Every delegation. Every result.")
    print(f"  (Article 2 — split memory: context_memory + provenance_service)")
    print(f"{'█'*80}")

    by_type = {}
    for r in all_records:
        by_type[r.record_type] = by_type.get(r.record_type, 0) + 1
    for rtype, count in by_type.items():
        print(f"  {rtype:20}: {count} records")

    print(f"\n{'═'*80}")
    print(f"  Level 1 complete — {len(all_records)} provenance records across 7 service boundaries")
    print(f"  Next: Level 2 — operator console with trust graph and approval queue")
    print(f"{'═'*80}\n")


if __name__ == "__main__":
    run()
