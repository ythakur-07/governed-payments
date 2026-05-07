"""
control_plane.py — Read-only control and registry publication.

Equivalent to apps/control-plane in nkhatu/control-architecture.
All other services consume configuration from here — never from local files directly.
This keeps policy thresholds, registry data, and kill switches in one governed place.
"""
from dataclasses import dataclass, field
from typing import Optional


# ── Configuration Schema ───────────────────────────────────────────────────────

@dataclass
class RailControls:
    max_amount:              float
    approval_required_above: float
    supported_currencies:    list
    idempotency_window_secs: int
    release_timeout_secs:    int


@dataclass
class CapabilityDescriptor:
    """Machine-readable capability contract — what can be called, with what semantics."""
    name:             str
    type:             str    # "draft" | "validation" | "execution" | "inquiry"
    has_side_effect:  bool
    idempotent:       bool
    description:      str


@dataclass
class AgentCard:
    """Registry entry for each agent — what it is, what it can do."""
    agent_id:    str
    role:        str    # "parent" | "delegated"
    description: str
    actions:     list


@dataclass
class ControlPlaneSnapshot:
    """The full published snapshot consumed by all services."""
    version:        str
    kill_switch:    bool
    rail_controls:  RailControls
    capabilities:   list    # list of CapabilityDescriptor
    agents:         list    # list of AgentCard


# ── Control Plane Service ──────────────────────────────────────────────────────

class ControlPlane:
    """
    Read-only runtime boundary. Publishes config + registry.
    Consumers call snapshot() — they do not read local files directly.
    Write path, versioning, and governance are explicitly out of scope for this PoC.
    """

    def __init__(self):
        self._snapshot = ControlPlaneSnapshot(
            version="2026-04-25.1",
            kill_switch=False,
            rail_controls=RailControls(
                max_amount=10_000.00,
                approval_required_above=250.00,
                supported_currencies=["USD", "EUR", "GBP"],
                idempotency_window_secs=3600,
                release_timeout_secs=30,
            ),
            capabilities=[
                CapabilityDescriptor(
                    name="create_instruction",
                    type="draft",
                    has_side_effect=False,
                    idempotent=True,
                    description="Drafts a new payment instruction. No external calls; fully reversible before release."
                ),
                CapabilityDescriptor(
                    name="validate_beneficiary",
                    type="validation",
                    has_side_effect=False,
                    idempotent=True,
                    description="Checks that the receiving account is eligible to receive funds. Read-only; no money moves."
                ),
                CapabilityDescriptor(
                    name="release_payment",
                    type="execution",
                    has_side_effect=True,
                    idempotent=True,
                    description="Executes the payment on the external rail. Irreversible once sent. Requires prior human approval."
                ),
                CapabilityDescriptor(
                    name="get_status",
                    type="inquiry",
                    has_side_effect=False,
                    idempotent=True,
                    description="Queries current payment status from the rail. Read-only inquiry; no side effects."
                ),
            ],
            agents=[
                AgentCard(
                    agent_id="agent.payment_orchestrator",
                    role="parent",
                    description="Root coordinator — receives payment requests, validates against policy, and delegates work to specialist agents.",
                    actions=["submit", "resume", "get_task"]
                ),
                AgentCard(
                    agent_id="agent.compliance_screening",
                    role="delegated",
                    description="Specialist — validates beneficiary accounts before any funds are moved. Delegated scope only.",
                    actions=["validate_beneficiary"]
                ),
                AgentCard(
                    agent_id="agent.approval_router",
                    role="delegated",
                    description="Specialist — routes payments above the approval threshold to the human operator queue. Delegated scope only.",
                    actions=["route_approval"]
                ),
            ]
        )

    def snapshot(self) -> ControlPlaneSnapshot:
        """Return the current control-plane snapshot."""
        return self._snapshot

    def update_rail_controls(self, **kwargs):
        """Mutate rail controls in place. Unknown keys are ignored."""
        r = self._snapshot.rail_controls
        if "max_amount" in kwargs:
            r.max_amount = float(kwargs["max_amount"])
        if "approval_required_above" in kwargs:
            r.approval_required_above = float(kwargs["approval_required_above"])
        if "supported_currencies" in kwargs:
            r.supported_currencies = list(kwargs["supported_currencies"])
        if "idempotency_window_secs" in kwargs:
            r.idempotency_window_secs = int(kwargs["idempotency_window_secs"])
        if "release_timeout_secs" in kwargs:
            r.release_timeout_secs = int(kwargs["release_timeout_secs"])

    def capabilities(self) -> list:
        return self._snapshot.capabilities

    def agents(self) -> list:
        return self._snapshot.agents

    def rail_controls(self) -> RailControls:
        return self._snapshot.rail_controls

    def is_live(self) -> bool:
        """Kill switch check. If True, no payments process."""
        return not self._snapshot.kill_switch

    def version(self) -> str:
        return self._snapshot.version
