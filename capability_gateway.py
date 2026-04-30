"""
capability_gateway.py — Typed wrappers around the payment rail.

Equivalent to apps/capability-gateway in nkhatu/control-architecture.
Each capability is narrow, typed, and has explicit side-effect semantics.
Release is idempotency-aware. Ambiguous outcomes degrade safely.

No business logic lives here — only rail interaction.
Policy, state, and orchestration remain in their own boundaries.
"""
import uuid
from models import TaskSnapshot, CapabilityResult


class CapabilityGateway:
    """
    The execution surface. Agents and orchestrators invoke typed capabilities —
    never generic "process payment" endpoints.

    Current rail: mock (deterministic simulation for PoC).
    Production: replace mock implementations with real rail adapters.
    """

    def __init__(self):
        self._idempotency_store: dict = {}   # key → result (replay protection)
        self._release_counter:   int  = 0    # for simulating transient errors

    def create_instruction(self, task: TaskSnapshot) -> CapabilityResult:
        """
        Draft a payment instruction on the rail.
        No side effect — safe to retry.
        """
        idem_key = f"create:{task.idempotency_key}"
        if idem_key in self._idempotency_store:
            return self._idempotency_store[idem_key]

        instruction_id = f"instr_{task.task_id[:6]}"
        result = CapabilityResult(
            success=True,
            capability="create_instruction",
            outcome="success",
            data={
                "instruction_id": instruction_id,
                "amount":         task.amount,
                "currency":       task.currency,
                "sender":         task.sender_wallet,
                "receiver":       task.receiver_wallet,
            },
            idempotency_key=idem_key
        )
        self._idempotency_store[idem_key] = result
        return result

    def validate_beneficiary(self, task: TaskSnapshot) -> CapabilityResult:
        """
        Validate receiver wallet eligibility.
        No side effect — safe to retry.
        Delegated to agent.compliance_screening.
        """
        idem_key = f"validate:{task.idempotency_key}"
        if idem_key in self._idempotency_store:
            return self._idempotency_store[idem_key]

        # Mock: all merchant_techsupplies and merchant_cloudsvc are valid
        valid_receivers = {"wallet_techsupplies_01", "wallet_cloudsvc_01"}
        ok = task.receiver_wallet in valid_receivers

        result = CapabilityResult(
            success=ok,
            capability="validate_beneficiary",
            outcome="success" if ok else "reject",
            data={
                "receiver":         task.receiver_wallet,
                "validation_status": "validated" if ok else "rejected",
                "check":            "account_exists_and_eligible",
            },
            idempotency_key=idem_key
        )
        self._idempotency_store[idem_key] = result
        return result

    def release_payment(self, task: TaskSnapshot) -> CapabilityResult:
        """
        Execute the payment release. FINANCIAL SIDE EFFECT.
        Idempotent — replays return the original result.
        Ambiguous outcomes degrade to pending_reconcile (safe failure).
        Simulates a transient error on the first attempt.
        """
        idem_key = f"release:{task.idempotency_key}"
        if idem_key in self._idempotency_store:
            cached = self._idempotency_store[idem_key]
            cached.data["replayed"] = True
            return cached

        self._release_counter += 1

        # Simulate transient failure on first attempt, success on second
        if self._release_counter == 1:
            result = CapabilityResult(
                success=False,
                capability="release_payment",
                outcome="ambiguous",
                data={
                    "instruction_id": task.rail_instruction_id,
                    "error":          "Rail timeout — outcome unknown",
                    "action":         "degrade to pending_reconcile",
                },
                idempotency_key=idem_key
            )
            # Do NOT cache ambiguous — allows retry
            return result

        result = CapabilityResult(
            success=True,
            capability="release_payment",
            outcome="success",
            data={
                "instruction_id":   task.rail_instruction_id,
                "amount":           task.amount,
                "currency":         task.currency,
                "rail_reference":   f"rail_ref_{uuid.uuid4().hex[:8]}",
                "settlement_window": "T+1",
            },
            idempotency_key=idem_key
        )
        self._idempotency_store[idem_key] = result
        return result

    def get_status(self, task_id: str, instruction_id: str) -> CapabilityResult:
        """
        Inquiry — no side effect.
        """
        return CapabilityResult(
            success=True,
            capability="get_status",
            outcome="success",
            data={
                "task_id":        task_id,
                "instruction_id": instruction_id,
                "status":         "settlement_pending",
            },
            idempotency_key=f"status:{task_id}"
        )
