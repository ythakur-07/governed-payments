"""
models.py — Shared contracts across all service boundaries.

Equivalent to packages/shared-contracts in nkhatu/control-architecture.
These types are the typed transport layer between services.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from enum import Enum


# ── Task Lifecycle ─────────────────────────────────────────────────────────────

class TaskState(Enum):
    RECEIVED           = "received"
    AWAITING_VALIDATION = "awaiting_validation"
    AWAITING_APPROVAL  = "awaiting_approval"
    APPROVED           = "approved"
    RELEASING          = "releasing"
    SETTLEMENT_PENDING = "settlement_pending"
    PENDING_RECONCILE  = "pending_reconcile"
    SETTLED            = "settled"
    FAILED             = "failed"
    EXCEPTION          = "exception"


class PolicyDecisionType(Enum):
    ALLOW    = "allow"
    DENY     = "deny"
    ESCALATE = "escalate"


class DelegatedWorkStatus(Enum):
    PENDING   = "pending"
    COMPLETED = "completed"
    FAILED    = "failed"


class LiabilityOwner(Enum):
    SENDER_WALLET   = "SENDER_WALLET"
    NETWORK         = "NETWORK"
    RECEIVER_WALLET = "RECEIVER_WALLET"
    MERCHANT        = "MERCHANT"


# ── Delegation Token (Article 3) ───────────────────────────────────────────────

@dataclass
class DelegationToken:
    """
    Scoped, time-bound authority token.
    Identity ≠ Authority — this token carries authority, not just identity.
    Minimum Delegation Principle: spend_limit is the ceiling for this hop.
    """
    token_id:                   str
    principal:                  str
    delegated_by:               str
    delegation_depth_remaining: int
    spend_limit:                float
    spent:                      float
    merchant_allowlist:         list
    currency_restriction:       str
    valid_until:                datetime
    reversal_window_hours:      int
    revoked:                    bool = False

    def remaining_authority(self) -> float:
        return max(0.0, self.spend_limit - self.spent)


# ── Task Snapshot (context_memory_service) ─────────────────────────────────────

@dataclass
class TaskSnapshot:
    """
    Current mutable task state — lives in context_memory_service.
    Queryable and operational. Separate from provenance.
    """
    task_id:           str
    amount:            float
    currency:          str
    sender_wallet:     str
    receiver_wallet:   str
    merchant_id:       str
    merchant_name:     str
    initiated_by:      str   # human user or system
    agent:             str   # parent agent handling this task
    token_id:          str
    idempotency_key:   str
    state:             TaskState = TaskState.RECEIVED

    # Set during workflow
    approval_operator:      Optional[str] = None
    rail_instruction_id:    Optional[str] = None
    beneficiary_status:     Optional[str] = None
    release_result:         Optional[str] = None
    liability_owner:        str = LiabilityOwner.SENDER_WALLET.value

    created_at: str = field(default_factory=lambda: datetime.now().isoformat(timespec='seconds'))
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat(timespec='seconds'))


# ── Outbox Event ───────────────────────────────────────────────────────────────

@dataclass
class OutboxEvent:
    """
    Written transactionally by context_memory_service when state changes.
    Consumed by event_consumer → projected into provenance_service.
    Guarantees consistency between split state boundaries.
    """
    event_id:   str
    task_id:    str
    event_type: str    # "task_created" | "state_changed"
    actor:      str
    actor_type: str    # "agent" | "operator" | "system"
    from_state: Optional[str]
    to_state:   Optional[str]
    payload:    dict
    created_at: str  = field(default_factory=lambda: datetime.now().isoformat(timespec='seconds'))
    consumed:   bool = False


# ── Provenance Record (provenance_service) ─────────────────────────────────────

@dataclass
class ProvenanceRecord:
    """
    Append-only evidence record — lives in provenance_service.
    Never mutated. Every state change, artifact, and delegation leaves a trace.
    """
    record_id:   str
    task_id:     str
    record_type: str    # "state_transition" | "artifact" | "delegation"
    actor:       str
    actor_type:  str
    data:        dict
    created_at:  str = field(default_factory=lambda: datetime.now().isoformat(timespec='seconds'))


# ── Delegated Work Record (provenance_service) ─────────────────────────────────

@dataclass
class DelegatedWork:
    """
    Explicit delegation record — parent agent assigns bounded work to a delegated agent.
    Both the request and response envelopes are persisted.
    This is Article 3's MDP in action: each delegation carries only the scope needed.
    """
    work_id:           str
    task_id:           str
    parent_agent:      str
    delegated_agent:   str
    action:            str
    request_envelope:  dict
    response_envelope: Optional[dict] = None
    status:            DelegatedWorkStatus = DelegatedWorkStatus.PENDING
    created_at:        str = field(default_factory=lambda: datetime.now().isoformat(timespec='seconds'))
    completed_at:      Optional[str] = None


# ── Policy Contracts ───────────────────────────────────────────────────────────

@dataclass
class PolicyDecision:
    """
    Deterministic output from policy_engine.
    Policy lives outside the model — always.
    """
    decision:         PolicyDecisionType
    reason:           str
    policy_artifact:  dict    # what was evaluated — persisted in provenance
    policy_version:   str = "1.0"


# ── Capability Contracts ───────────────────────────────────────────────────────

@dataclass
class CapabilityResult:
    """
    Typed output from capability_gateway.
    outcome can be "success" | "reject" | "ambiguous" — ambiguous degrades to pending_reconcile.
    """
    success:          bool
    capability:       str
    outcome:          str    # "success" | "reject" | "ambiguous"
    data:             dict
    idempotency_key:  str
