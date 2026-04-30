"""
context_memory.py — Current task snapshot boundary.

Equivalent to services/context-memory-service in nkhatu/control-architecture.
Owns the current mutable task state. Queryable and operational.
Writes outbox events in the same "transaction" as state changes — this is
the consistency guarantee that lets provenance_service stay in sync.

Key separation: context_memory knows CURRENT state.
                provenance_service knows HISTORY.
These are never merged into one store.
"""
import uuid
from datetime import datetime
from typing import Optional
from models import TaskSnapshot, TaskState, OutboxEvent, LiabilityOwner


# Liability boundary map — Article 1: liability is the real constraint
LIABILITY_MAP = {
    TaskState.RECEIVED:            LiabilityOwner.SENDER_WALLET,
    TaskState.AWAITING_VALIDATION: LiabilityOwner.SENDER_WALLET,
    TaskState.AWAITING_APPROVAL:   LiabilityOwner.SENDER_WALLET,
    TaskState.APPROVED:            LiabilityOwner.SENDER_WALLET,
    TaskState.RELEASING:           LiabilityOwner.NETWORK,
    TaskState.SETTLEMENT_PENDING:  LiabilityOwner.RECEIVER_WALLET,
    TaskState.PENDING_RECONCILE:   LiabilityOwner.NETWORK,
    TaskState.SETTLED:             LiabilityOwner.MERCHANT,
    TaskState.FAILED:              LiabilityOwner.SENDER_WALLET,
    TaskState.EXCEPTION:           LiabilityOwner.NETWORK,
}


class ContextMemoryService:
    """
    In-memory store for the current task snapshot.
    In production: SQLAlchemy-backed Postgres with transactional outbox.
    """

    def __init__(self):
        self._tasks:  dict = {}    # task_id → TaskSnapshot
        self._outbox: list = []    # OutboxEvent queue (consumed by event_consumer)

    # ── Write operations ──────────────────────────────────────────────────────

    def create_task(self, snapshot: TaskSnapshot, actor: str) -> TaskSnapshot:
        """
        Persist a new task snapshot.
        Writes an outbox event in the same operation.
        """
        snapshot.liability_owner = LIABILITY_MAP[snapshot.state].value
        self._tasks[snapshot.task_id] = snapshot
        self._emit_outbox(
            task_id=snapshot.task_id,
            event_type="task_created",
            actor=actor,
            actor_type="agent",
            from_state=None,
            to_state=snapshot.state.value,
            payload={
                "amount":       snapshot.amount,
                "currency":     snapshot.currency,
                "merchant":     snapshot.merchant_name,
                "token_id":     snapshot.token_id,
                "liability":    snapshot.liability_owner,
            }
        )
        return snapshot

    def update_state(
        self,
        task_id: str,
        new_state: TaskState,
        actor: str,
        actor_type: str = "agent",
        extra_fields: Optional[dict] = None
    ) -> TaskSnapshot:
        """
        Advance task to a new state.
        Updates liability boundary automatically.
        Emits outbox event — provenance_service picks this up.
        """
        task = self._tasks[task_id]
        old_state = task.state

        task.state         = new_state
        task.updated_at    = datetime.now().isoformat(timespec='seconds')
        task.liability_owner = LIABILITY_MAP[new_state].value

        if extra_fields:
            for k, v in extra_fields.items():
                if hasattr(task, k):
                    setattr(task, k, v)

        self._emit_outbox(
            task_id=task_id,
            event_type="state_changed",
            actor=actor,
            actor_type=actor_type,
            from_state=old_state.value,
            to_state=new_state.value,
            payload={
                "liability":     task.liability_owner,
                "extra_fields":  extra_fields or {},
            }
        )
        return task

    # ── Read operations ───────────────────────────────────────────────────────

    def get_task(self, task_id: str) -> Optional[TaskSnapshot]:
        return self._tasks.get(task_id)

    def list_tasks(self) -> list:
        return list(self._tasks.values())

    # ── Outbox ────────────────────────────────────────────────────────────────

    def drain_outbox(self) -> list:
        """
        Return and mark all unconsumed outbox events.
        Called by event_consumer to project into provenance_service.
        """
        pending = [e for e in self._outbox if not e.consumed]
        for e in pending:
            e.consumed = True
        return pending

    def _emit_outbox(self, task_id, event_type, actor, actor_type,
                     from_state, to_state, payload):
        event = OutboxEvent(
            event_id=f"evt_{uuid.uuid4().hex[:8]}",
            task_id=task_id,
            event_type=event_type,
            actor=actor,
            actor_type=actor_type,
            from_state=from_state,
            to_state=to_state,
            payload=payload,
        )
        self._outbox.append(event)
        return event
