# Servelink Admin UI Overview

## Purpose

The Servelink Admin UI is the operations control plane for monitoring, understanding, and intervening in dispatch behavior safely.

It is not a customer app and not a franchise owner app. It is an internal operational system for admins.

## Primary goals

The first version of the Admin UI must allow admins to:

1. monitor dispatch health
2. investigate dispatch outcomes
3. understand why dispatch made a decision
4. intervene manually when needed
5. manage dispatch configuration safely
6. review recent admin activity and audit history

## Core product areas

- Dispatch dashboard
- Dispatch exceptions
- Booking dispatch detail
- Dispatch config control
- Admin activity feed

## Design philosophy

The Admin UI should feel:

- operational
- trustworthy
- explainable
- low-friction
- high-signal
- audit-friendly

It should prioritize clarity and decision support over visual novelty.

## Non-goals for v1

The first version of the Admin UI does not attempt to be:

- a full BI dashboard
- a configurable analytics platform
- a simulator lab
- a franchise owner portal
- a customer support suite

## Backend readiness status

The backend already supports:

- dispatch timeline and decision history
- dispatch explainer
- manual dispatch operations
- dispatch config compare / preview / publish
- publish audit history
- rollback to draft from audit
- exceptions list / detail / triage / prescriptive data
- admin activity feed
- normalized list contracts
- permission architecture
