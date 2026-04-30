"""
orchestrator.py — Intake API, registry lookups, policy checks, workflow kickoff.

Equivalent to apps/orchestrator-api in nkhatu/control-architecture.
The orchestrator is the entry point for payment tasks — both REST and MCP.
It does not execute payments. It coordinates: policy check → workflow start → state read.

MCP-style tool surface exposed here (simulated as Python methods).
In production: FastAPI with MCP server adapter alongside REST endpoints.
"""
import uuid
from datetime import datetime
from models import TaskSnapshot, TaskState, DelegationToken, PolicyDecisionType
from control_plane import ControlPlane
from policy_engine import PolicyEngine
from context_memory import ContextMemoryService
from provenance import ProvenanceService
from workflow_worker import WorkflowWorker


PARENT_AGENT = "agent.payment_orchestrator"


class OrchestratorAPI:
    """
    Intake and coordination layer.
    Exposes: submit_payment, resume_after_approval, get_task.
    Does not own: policy decisions, capability calls, or workflow execution.
    """

    def __init__(
        self,
        control_plane:   ControlPlane,
        policy_engine:   PolicyEngine,
        context_memory:  ContextMemoryService,
        provenance:      ProvenanceService,
        workflow_worker: WorkflowWorker,
        auth_tokens:     dict,    # token_id → DelegationToken
    ):
        self._cp     = control_plane
        self._pe     = policy_engine
        self._ctx    = context_memory
        self._prov   = provenance
        self._worker = workflow_worker
        self._tokens = auth_tokens

    # ── MCP Tool: submit_payment ───────────────────────────────────────────────

    def submit_payment(
        self,
        amount:         float,
        currency:       str,
        sender_wallet:  str,
        receiver_wallet: str,
        merchant_id:    str,
        merchant_name:  str,
        initiated_by:   str,
        token_id:       str,
        idempotency_key: str,
    ) -> dict:
        """
        Accept a domestic payment task.
        1. Validate registry (control_plane)
        2. Run intake policy (policy_engine)
        3. Create task snapshot (context_memory)
        4. Start workflow (workflow_worker)
        Returns task_id and initial state.
        """
        svc = "[ORCHESTR ]"
        print(f"\n  {svc}  submit_payment received")
        print(f"  {svc}  ${amount:.2f} {currency} → {merchant_name} | key: {idempotency_key}")

        # ── Registry check ────────────────────────────────────────────────────
        if not self._cp.is_live():
            return {"error": "Kill switch active — no payments processing"}

        token = self._tokens.get(token_id)
        if not token:
            return {"error": f"Token {token_id} not found"}

        # ── Build task snapshot ───────────────────────────────────────────────
        task_id = f"task_{uuid.uuid4().hex[:8]}"
        snapshot = TaskSnapshot(
            task_id=task_id,
            amount=amount,
            currency=currency,
            sender_wallet=sender_wallet,
            receiver_wallet=receiver_wallet,
            merchant_id=merchant_id,
            merchant_name=merchant_name,
            initiated_by=initiated_by,
            agent=PARENT_AGENT,
            token_id=token_id,
            idempotency_key=idempotency_key,
            state=TaskState.RECEIVED,
        )

        # ── Intake policy decision ────────────────────────────────────────────
        print(f"  {svc}  → policy_engine.decide_intake()")
        decision = self._pe.decide_intake(snapshot, token)
        self._ctx.create_task(snapshot, actor=PARENT_AGENT)
        self._prov.record_policy_decision(task_id, decision, PARENT_AGENT)

        if decision.decision == PolicyDecisionType.DENY:
            self._ctx.update_state(task_id, TaskState.FAILED, PARENT_AGENT)
            print(f"  {svc}  ✗ Intake DENIED: {decision.reason}")
            print(f"  {svc}  → FAILED | Liability: SENDER_WALLET (no funds moved)")
            return {"task_id": task_id, "state": TaskState.FAILED.value, "reason": decision.reason}

        print(f"  {svc}  ✓ Intake ALLOWED: {decision.reason}")

        # ── Drain outbox → provenance (event_consumer simulation) ─────────────
        self._drain_outbox()

        # ── Start workflow ────────────────────────────────────────────────────
        print(f"  {svc}  → workflow_worker.start_workflow()")
        final_state = self._worker.start_workflow(task_id, token)

        self._drain_outbox()

        return {"task_id": task_id, "state": final_state}

    # ── MCP Tool: resume_after_approval ──────────────────────────────────────

    def resume_after_approval(self, task_id: str, operator: str) -> dict:
        """
        Operator resumes a task that is awaiting_approval.
        Re-runs release policy then drives workflow to terminal state.
        """
        svc = "[ORCHESTR ]"
        print(f"\n  {svc}  resume_after_approval | operator: {operator} | task: {task_id}")

        task = self._ctx.get_task(task_id)
        if not task:
            return {"error": f"Task {task_id} not found"}

        token = self._tokens.get(task.token_id)
        final_state = self._worker.resume_after_approval(task_id, operator, token)

        self._drain_outbox()

        return {"task_id": task_id, "state": final_state}

    # ── MCP Resource: get_task ────────────────────────────────────────────────

    def get_task(self, task_id: str) -> dict:
        """
        Return merged task view: current snapshot + provenance evidence.
        Equivalent to the composite task-boundary client in the reference repo.
        """
        task      = self._ctx.get_task(task_id)
        evidence  = self._prov.get_task_evidence(task_id)
        delegations = self._prov.get_delegations(task_id)

        if not task:
            return {"error": f"Task {task_id} not found"}

        return {
            "snapshot":    {
                "task_id":         task.task_id,
                "state":           task.state.value,
                "amount":          task.amount,
                "currency":        task.currency,
                "merchant":        task.merchant_name,
                "liability_owner": task.liability_owner,
                "approval_by":     task.approval_operator,
                "release_ref":     task.release_result,
                "updated_at":      task.updated_at,
            },
            "provenance_count": len(evidence),
            "delegations":  [
                {
                    "work_id":       d.work_id,
                    "delegated_to":  d.delegated_agent,
                    "action":        d.action,
                    "status":        d.status.value,
                }
                for d in delegations
            ],
        }

    # ── Internal ──────────────────────────────────────────────────────────────

    def _drain_outbox(self):
        """Simulate event_consumer: drain outbox → project into provenance."""
        events = self._ctx.drain_outbox()
        for event in events:
            self._prov.project_outbox_event(event)
