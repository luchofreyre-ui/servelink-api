# Supply Overview

## Route
- `/admin/supply`

## Purpose
Owner-facing supply intelligence control center.

## Permissions
- supply.read
- owner or owner-equivalent for some actions

## Primary APIs
To be implemented by supply backend when ready.

## Page layout

```text
Header
- Title: Supply Intelligence
- Subtitle: Predictive supply operations overview

Row 1
- FO Runway Risk
- Upcoming Shipments

Row 2
- Forecast Demand
- Supply Alerts / Anomalies

Row 3
- Recent Rule Changes / Owner Adjustments
```

## Main sections
- FO runway risk table
- shipment queue summary
- next 7/14/30 day demand forecast
- supply alerts
- recent owner actions

## Drill-down
- FO row → FO Supply Detail
- shipment item → Shipment Planner
- rule change → Supply Rules or Supply Activity
