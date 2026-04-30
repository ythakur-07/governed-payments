"""
provenance.py — Append-only evidence and delegation boundary.

Equivalent to services/provenance-service in nkhatu/control-architecture.
Never mutated. Every state change, policy decision, capability result,
and delegated work record is written here and stays forever.

Key separation: provenance_service knows HISTORY.
                context_memory_service knows CURRENT state.
These are different boundaries with different consistency requirements.

event_consumer projects outbox events from context_memory into provenance.
This keeps the two stores consistent without tight coupling.
"""
import uuid
from datetime import datetime
from typing import Optional
from models import ProvenanceRecord, DelegatedWork, DelegatedWorkStatus, PolicyDecision, CapabilityResult


class ProvenanceService:
    """
    Append-only provenance and delegation record store.
    In production: SQLAlchemy-backed Postgres, insert-only, indexed by task_id.
    """

    def __init__(self):
        self._records:    list = []   # ProvenanceRecord[]
        self._delegations: list = []  # DelegatedWork[]

    # ── Projection from context_memory outbox (via event_consumer) ────────────

    def project_outbox_event(self, event) -> ProvenanceRecord:
        """
        Called by event_consumer when it drains the context_memory outbox.
        Idempotent — duplicate event_ids are safely ignored.
        """
        # Idempotency: skip if already projected
        if any(r.data.get("event_id") == event.event_id for r in self._records):
            return None

        return self._write(
            task_id=event.task_id,
            record_type="state_transition",
            actor=event.actor,
            actor_type=event.actor_type,
            data={
                "event_id":   event.event_id,
                "event_type": event.event_type,
                "from_state": event.from_state,
                "to_state":   event.to_state,
                "liability":  event.payload.get("liability"),
                **event.payload
            }
        )

    # ── Policy artifacts ──────────────────────────────────────────────────────

    def record_policy_decision(self, task_id: str, decision: PolicyDecision,
                                actor: str) -> ProvenanceRecord:
        """Persist every policy decision — intake and release."""
        return self._write(
            task_id=task_id,
            record_type="artifact",
            actor=actor,
            actor_type="system",
            data={
                "artifact_type":   "policy_decision",
                "decision":        decision.decision.value,
                "reason":          decision.reason,
                "policy_artifact": decision.policy_artifact,
                "policy_version":  decision.policy_version,
            }
        )

    # ── Capability results ────────────────────────────────────────────────────

    def record_capability_result(self, task_id: str, result: CapabilityResult,
                                  actor: str) -> ProvenanceRecord:
        """Persist every capability invocation result."""
        return self._write(
            task_id=task_id,
            record_type="artifact",
            actor=actor,
            actor_type="system",
            data={
                "artifact_type":    "capability_result",
                "capability":       result.capability,
                "outcome":          result.outcome,
                "success":          result.success,
                "data":             result.data,
                "idempotency_key":  result.idempotency_key,
            }
        )

    # ── Delegation records ────────────────────────────────────────────────────

    def open_delegation(self, task_id: str, parent_agent: str,
                         delegated_agent: str, action: str,
                         request_envelope: dict) -> DelegatedWork:
        """
        Record the start of a delegated work item.
        Both request and response envelopes are explicit — no anonymous service calls.
        """
        work = DelegatedWork(
            work_id=f"work_{uuid.uuid4().hex[:8]}",
            task_id=task_id,
            parent_agent=parent_agent,
            delegated_agent=delegated_agent,
            action=action,
            request_envelope=request_envelope,
            status=DelegatedWorkStatus.PENDING,
        )
        self._delegations.append(work)

        self._write(
            task_id=task_id,
            record_type="delegation",
            actor=parent_agent,
            actor_type="agent",
            data={
                "work_id":         work.work_id,
                "delegated_to":    delegated_agent,
                "action":          action,
                "status":          "pending",
                "request_envelope": request_envelope,
            }
        )
        return work

    def close_delegation(self, work_id: str, response_envelope: dict,
                          success: bool) -> DelegatedWork:
        """Record the completion of a delegated work item."""
        work = next((w for w in self._delegations if w.work_id == work_id), None)
        if not work:
            return None

        work.response_envelope = response_envelope
        work.status            = DelegatedWorkStatus.COMPLETED if success else DelegatedWorkStatus.FAILED
        work.completed_at      = datetime.now().isoformat(timespec='seconds')

        self._write(
            task_id=work.task_id,
            record_type="delegation",
            actor=work.delegated_agent,
            actor_type="agent",
            data={
                "work_id":          work.work_id,
                "delegated_to":     work.delegated_agent,
                "action":           work.action,
                "status":           work.status.value,
                "response_envelope": response_envelope,
            }
        )
        return work

    # ── Read operations ───────────────────────────────────────────────────────

    def get_task_evidence(self, task_id: str) -> list:
        """All provenance records for a task — state transitions, artifacts, delegations."""
        return [r for r in self._records if r.task_id == task_id]

    def get_delegations(self, task_id: str) -> list:
        """All delegation records for a task."""
        return [d for d in self._delegations if d.task_id == task_id]

    def get_all_records(self) -> list:
        return list(self._records)

    # ── Internal ──────────────────────────────────────────────────────────────

    def _write(self, task_id, record_type, actor, actor_type, data) -> ProvenanceRecord:
        record = ProvenanceRecord(
            record_id=f"prov_{uuid.uuid4().hex[:8]}",
            task_id=task_id,
            record_type=record_type,
            actor=actor,
            actor_type=actor_type,
            data=data,
        )
        self._records.append(record)
        return record
