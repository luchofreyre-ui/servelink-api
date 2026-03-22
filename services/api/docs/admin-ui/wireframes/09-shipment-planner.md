# Shipment Planner

## Route
- `/admin/supply/shipments`

## Purpose
Owner-facing shipment decision queue.

## Permissions
- supply.read
- supply.shipments.write
- owner for final controls

## Primary APIs
To be implemented by supply backend when ready.

## Page layout

```text
Header
- Title: Shipment Planner
- Subtitle: Predictive refill shipment queue

Filter row
- market
- risk level
- shipment status
- scheduled date
- FO
- category

Main table
- FO
- runway risk
- ship date
- status
- days remaining
- categories
- batching score
- reason
- actions
```

## Actions
- approve shipment
- delay shipment
- force shipment
- merge shipments
- cancel recommendation

## Empty state
- no shipments currently recommended
