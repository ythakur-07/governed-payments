"""
workflow_worker.py — Task lifecycle execution and delegated agent runtime.

Equivalent to services/workflow-worker in nkhatu/control-architecture.
Owns the active workflow path. Orchestration lives here, not in the API.
Policy decisions live in policy_engine. Capability calls go through capability_gateway.
The worker delegates bounded work to sub-agents — never invoking capabilities directly
on their behalf without an explicit delegation record.

Key states driven here:
  received → awaiting_validation → awaiting_approval → approved → releasing
  → settlement_pending | pending_reconcile | failed | exception
"""
from datetime import datetime
from models import TaskState, PolicyDecisionType
from context_memory import ContextMemoryService
from provenance import ProvenanceService
from capability_gateway import CapabilityGateway
from policy_engine import PolicyEngine


PARENT_AGENT    = "agent.payment_orchestrator"
COMPLIANCE_AGENT = "agent.compliance_screening"
APPROVAL_AGENT   = "agent.approval_router"


class WorkflowWorker:
    """
    Drives the payment task from intake to terminal state.
    Pauses at awaiting_approval — operator resume required before release.
    In production: Temporal-native workflow execution with durable replay.
    """

    def __init__(
        self,
        context_memory:    ContextMemoryService,
        provenance:        ProvenanceService,
        capability_gateway: CapabilityGateway,
        policy_engine:     PolicyEngine,
    ):
        self._ctx  = context_memory
        self._prov = provenance
        self._gw   = capability_gateway
        self._pe   = policy_engine

    def start_workflow(self, task_id: str, token) -> str:
        """
        Advance task from RECEIVED through validation and to AWAITING_APPROVAL.
        Returns terminal state name or "awaiting_approval" if human gate reached.
        """
        task = self._ctx.get_task(task_id)
        svc  = f"[WORKER   ]"

        _print(svc, f"Starting workflow for {task_id}")

        # ── Step 1: Create draft instruction ──────────────────────────────────
        _print(svc, "→ capability_gateway.create_instruction()")
        instruction = self._gw.create_instruction(task)
        self._prov.record_capability_result(task_id, instruction, PARENT_AGENT)

        if not instruction.success:
            self._ctx.update_state(task_id, TaskState.FAILED, PARENT_AGENT)
            _print(svc, f"✗ Instruction creation failed: {instruction.data}")
            return TaskState.FAILED.value

        task = self._ctx.update_state(
            task_id, TaskState.AWAITING_VALIDATION, PARENT_AGENT,
            extra_fields={"rail_instruction_id": instruction.data["instruction_id"]}
        )
        _print(svc, f"  Instruction created: {instruction.data['instruction_id']}")
        _print(svc, f"  State → AWAITING_VALIDATION | Liability: {task.liability_owner}")

        # ── Step 2: Delegate beneficiary validation ────────────────────────────
        _print(svc, f"→ Delegating beneficiary validation to {COMPLIANCE_AGENT}")
        work = self._prov.open_delegation(
            task_id=task_id,
            parent_agent=PARENT_AGENT,
            delegated_agent=COMPLIANCE_AGENT,
            action="validate_beneficiary",
            request_envelope={
                "receiver_wallet": task.receiver_wallet,
                "merchant_id":     task.merchant_id,
                "task_id":         task_id,
                "scope":           "beneficiary_validation_only",   # MDP: narrow scope
            }
        )

        validation = self._gw.validate_beneficiary(task)
        self._prov.record_capability_result(task_id, validation, COMPLIANCE_AGENT)
        self._prov.close_delegation(work.work_id, validation.data, validation.success)

        if not validation.success:
            task = self._ctx.update_state(task_id, TaskState.FAILED, COMPLIANCE_AGENT,
                                          actor_type="agent")
            _print(svc, f"✗ Beneficiary validation failed: {validation.data}")
            return TaskState.FAILED.value

        task = self._ctx.update_state(
            task_id, TaskState.AWAITING_VALIDATION, COMPLIANCE_AGENT,
            actor_type="agent",
            extra_fields={"beneficiary_status": validation.data["validation_status"]}
        )
        _print(svc, f"  Beneficiary: {validation.data['validation_status']}")

        # ── Step 3: Delegate approval routing ─────────────────────────────────
        _print(svc, f"→ Delegating approval routing to {APPROVAL_AGENT}")
        approval_work = self._prov.open_delegation(
            task_id=task_id,
            parent_agent=PARENT_AGENT,
            delegated_agent=APPROVAL_AGENT,
            action="route_approval",
            request_envelope={
                "task_id": task_id,
                "amount":  task.amount,
                "scope":   "approval_routing_only",   # MDP: narrow scope
            }
        )

        # Approval agent routes — task pauses here for operator
        task = self._ctx.update_state(
            task_id, TaskState.AWAITING_APPROVAL, APPROVAL_AGENT,
            actor_type="agent"
        )
        self._prov.close_delegation(
            approval_work.work_id,
            {"routed_to": "operator_queue", "task_id": task_id},
            success=True
        )
        _print(svc, f"  State → AWAITING_APPROVAL | Liability: {task.liability_owner}")
        _print(svc, "  ⏸  Workflow paused — operator approval required")

        return TaskState.AWAITING_APPROVAL.value

    def resume_after_approval(self, task_id: str, operator: str, token) -> str:
        """
        Operator resumes the workflow after approval.
        Runs release policy check → capability_gateway.release_payment() with retry.
        """
        task = self._ctx.get_task(task_id)
        svc  = f"[WORKER   ]"

        if task.state != TaskState.AWAITING_APPROVAL:
            _print(svc, f"✗ Cannot resume — task is in {task.state.value}, not awaiting_approval")
            return task.state.value

        _print(svc, f"Operator '{operator}' resuming task {task_id}")

        # Record approval
        task = self._ctx.update_state(
            task_id, TaskState.APPROVED, operator,
            actor_type="operator",
            extra_fields={"approval_operator": operator}
        )
        _print(svc, f"  State → APPROVED | Liability: {task.liability_owner}")

        # ── Release policy check (Article 3: re-validate at every transition) ──
        _print(svc, "→ policy_engine.decide_release()")
        release_decision = self._pe.decide_release(task, token)
        self._prov.record_policy_decision(task_id, release_decision, PARENT_AGENT)

        if release_decision.decision != PolicyDecisionType.ALLOW:
            task = self._ctx.update_state(task_id, TaskState.FAILED, PARENT_AGENT)
            _print(svc, f"✗ Release policy DENIED: {release_decision.reason}")
            return TaskState.FAILED.value

        _print(svc, f"  Release policy: {release_decision.reason}")

        # ── Release with bounded retry ─────────────────────────────────────────
        task = self._ctx.update_state(task_id, TaskState.RELEASING, PARENT_AGENT)
        _print(svc, f"  State → RELEASING | Liability: {task.liability_owner}")

        max_retries = 3
        for attempt in range(1, max_retries + 1):
            _print(svc, f"→ capability_gateway.release_payment() attempt {attempt}")
            release = self._gw.release_payment(task)
            self._prov.record_capability_result(task_id, release, PARENT_AGENT)

            if release.outcome == "success":
                token.spent += task.amount
                task = self._ctx.update_state(
                    task_id, TaskState.SETTLEMENT_PENDING, PARENT_AGENT,
                    extra_fields={"release_result": release.data.get("rail_reference")}
                )
                _print(svc, f"  ✓ Released: {release.data.get('rail_reference')}")
                _print(svc, f"  State → SETTLEMENT_PENDING | Liability: {task.liability_owner}")
                return TaskState.SETTLEMENT_PENDING.value

            elif release.outcome == "ambiguous":
                _print(svc, f"  Attempt {attempt}: ambiguous outcome — degrading safely")
                if attempt == max_retries:
                    task = self._ctx.update_state(task_id, TaskState.PENDING_RECONCILE, PARENT_AGENT)
                    _print(svc, f"  State → PENDING_RECONCILE | Liability: {task.liability_owner}")
                    return TaskState.PENDING_RECONCILE.value

            else:
                task = self._ctx.update_state(task_id, TaskState.FAILED, PARENT_AGENT)
                _print(svc, f"✗ Release rejected: {release.data}")
                return TaskState.FAILED.value

        return TaskState.FAILED.value


def _print(prefix, msg):
    print(f"  {prefix}  {msg}")
